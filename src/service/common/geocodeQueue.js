import { ddClient } from "./dynamodb.js";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { GEOCODE_BATCH, GEOCODE_RATE, MDATA_TABLE, SUMMARY_TABLE } from "../config.js";
import { getGeocode } from "./geocode.js";
import { getWebSocketManager } from "./websocket.js";
import { QUEUE_ADD_LOC_KEY, WS_ADD_LOC, WS_ADD_LOC_UPDATE, WS_GEOCODE_UPDATE, WS_UPLOAD } from "../constants.js";

class GeocodeQueue {
	constructor(options = {}) {
		this.queue = [];
		this.processing = false;
		this.maxRatePerSecond = options.maxRatePerSecond || GEOCODE_RATE;
		this.batchSize = options.batchSize || GEOCODE_BATCH;
		this.processIntervalMs = Math.ceil((this.batchSize / this.maxRatePerSecond) * 1000);
		this.imgOwners = new Map();
		this.imgCallbacks = new Map();
	}

	/**
	 * Add a new geocode job to the queue
	 * @param {string} key - The image key/ID
	 * @param {number} lat - Latitude
	 * @param {number} lng - Longitude
	 */
	enqueue(key, lat, lng, userID, onComplete = () => {}) {
		if (!key || typeof lat !== "number" || typeof lng !== "number") {
			console.warn("Invalid geocode job parameters:", { key, lat, lng });
			return;
		}

		// Check if already in queue (avoid duplicates)
		const exists = this.queue.some(item => item.key === key);
		if (exists) {
			console.log(`Geocode job for ${key} already in queue, skipping duplicate`);
			return;
		}

		this.queue.push({ key, lat, lng });
		this.imgOwners.set(key, userID);
		this.imgCallbacks.set(key, onComplete);
		console.log(`Added geocode job for ${key}. Queue size: ${this.queue.length}`);

		// Start processing if not already running
		if (!this.processing) {
			this.startProcessing();
		}
	}

	/**
	 * Add multiple geocode jobs to the queue
	 * @param {Array<{key: string, lat: number, lng: number}>} items
	 */
	enqueueBatch(items) {
		if (!Array.isArray(items)) return;
		
		items.forEach(({ key, lat, lng, userID }) => {
			this.enqueue(key, lat, lng, userID);
		});
	}

	/**
	 * Start processing the queue
	 */
	async startProcessing() {
		if (this.processing) return;
		
		this.processing = true;
		console.log("Starting geocode queue processor");

		while (this.queue.length > 0) {
			const batch = this.queue.splice(0, this.batchSize);
			console.log(`Processing batch of ${batch.length} geocode jobs. ${this.queue.length} remaining in queue.`);

			try {
				await this.processBatch(batch);
			} catch (error) {
				console.error("Batch geocode processing error:", error.message);
				// Re-queue failed items at the end
				this.queue.push(...batch);
			}

			// Wait to respect rate limit before processing next batch
			if (this.queue.length > 0) {
				await this.delay(this.processIntervalMs);
			}
		}

		this.processing = false;
		console.log("Geocode queue processor stopped - queue empty");
	}

	/**
	 * Process a batch of geocode jobs
	 * @param {Array<{key: string, lat: number, lng: number}>} batch
	 */
	async processBatch(batch) {
		try {
			const geocoded = await getGeocode(batch);

			// Group updates by userId for websocket geoloc updates
			const userUpdates = new Map();

			// Update DynamoDB with results
			await Promise.all(geocoded.map(async ({ key, label }) => {
				if (!label) {
					console.warn(`No geocode result for ${key}`);
					return;
				}

				const userId = this.imgOwners.get(key);

				if (key.includes(QUEUE_ADD_LOC_KEY)) {
					if (userId) {
						if (!userUpdates.has(userId)) {
							userUpdates.set(userId, []);
						}
						userUpdates.get(userId).push({ key, readableLocation: label });
					}

					console.log("Skipping DB update for standalone location", key);
					return;
				}

				try {
					await ddClient.send(new UpdateCommand({
						TableName: MDATA_TABLE,
						Key: { uid: key },
						UpdateExpression: 'SET readableLocation = :loc',
						ExpressionAttributeValues: { ':loc': label },
					}));
					console.log(`Successfully geocoded ${key}: ${label}`);

					// Group by user for websocket notification
					if (userId) {
						if (!userUpdates.has(userId)) {
							userUpdates.set(userId, []);
						}
						userUpdates.get(userId).push({ key, readableLocation: label });
					}
				} catch (updateErr) {
					console.error(`Failed to update readableLocation for ${key}:`, updateErr.message);
					throw updateErr; // Re-throw to trigger re-queue
				}

				const imgCb = this.imgCallbacks.get(key);
				if (imgCb) {
					imgCb(label);
				}

				// Clean up maps after processing
				if (this.imgOwners.get(key)) {
					this.imgOwners.delete(key);
				}
				if (imgCb) {
					this.imgCallbacks.delete(key);
				}
			}));

			// Send websocket updates to users
			const wsManager = getWebSocketManager();
			if (wsManager) {
				userUpdates.forEach((updates, userId) => {
					if (wsManager.wsClients.get(userId)?.get(WS_UPLOAD)) {
							wsManager.sendToUser(userId, WS_UPLOAD, {
							type: WS_GEOCODE_UPDATE,
							updates
						});
						console.log(`Sent ${updates.length} geocode update(s) to user ${userId}`);
					}

					if (wsManager.wsClients.get(userId)?.get(WS_ADD_LOC)) {
							wsManager.sendToUser(userId, WS_ADD_LOC, {
							type: WS_ADD_LOC_UPDATE,
							updates
						});
						console.log(`Sent ${updates.length} standalone geocode update(s) to user ${userId}`);
					}
				});
			}

			// Close websockets of clients that have no more items in the geoloc queue
			this.checkAndCloseCompletedUsers(userUpdates);
		} catch (error) {
			console.error("Error processing geocode batch:", error.message);
			throw error;
		}
	}

	/**
	 * Check and close websockets for clients that have no more items in the queue
	 * @param {Map<string, Array>} processedUsers - Map of userId to their processed updates from this batch
	 */
	checkAndCloseCompletedUsers(processedUsers) {
		const wsManager = getWebSocketManager();
		if (!wsManager) return;

		// Get all unique user IDs that still have items in the queue
		const usersWithPendingItems = new Set();
		this.queue.forEach(item => {
			const userId = this.imgOwners.get(item.key);
			if (userId) {
				usersWithPendingItems.add(userId);
			}
		});

		// Check each user that was processed in this batch
		processedUsers.forEach((updates, userId) => {
			if (!usersWithPendingItems.has(userId)) {
				// This user has no more items in the queue
				const userSockets = wsManager.wsClients.get(userId);
				if (userSockets) {
					const uploadSocket = userSockets.get(WS_UPLOAD);
					if (uploadSocket && uploadSocket.readyState === uploadSocket.OPEN) {
						console.log(`Closing WebSocket for user ${userId} - all geocode jobs completed`);
						uploadSocket.close(1000, 'All geocode jobs completed');
					}
				}
			}
		});
	}

	/**
	 * Delay helper
	 * @param {number} ms - Milliseconds to delay
	 */
	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get current queue status
	 */
	getStatus() {
		return {
			queueSize: this.queue.length,
			processing: this.processing,
			maxRatePerSecond: this.maxRatePerSecond,
			batchSize: this.batchSize,
			processIntervalMs: this.processIntervalMs
		};
	}
}

// Export a singleton instance
export const geocodeQueue = new GeocodeQueue({
	maxRatePerSecond: GEOCODE_RATE,
	batchSize: GEOCODE_BATCH
});
