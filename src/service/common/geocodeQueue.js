import { ddClient } from "./dynamodb.js";
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { MDATA_TABLE } from "../config.js";
import { getGeocode } from "./geocode.js";

class GeocodeQueue {
	constructor(options = {}) {
		this.queue = [];
		this.processing = false;
		this.maxRatePerSecond = options.maxRatePerSecond || 45; // Stay under 50/sec limit with buffer
		this.batchSize = options.batchSize || 10; // Process 10 at a time
		this.processIntervalMs = Math.ceil((this.batchSize / this.maxRatePerSecond) * 1000);
	}

	/**
	 * Add a new geocode job to the queue
	 * @param {string} key - The image key/ID
	 * @param {number} lat - Latitude
	 * @param {number} lng - Longitude
	 */
	enqueue(key, lat, lng) {
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
		
		items.forEach(({ key, lat, lng }) => {
			this.enqueue(key, lat, lng);
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

			// Update DynamoDB with results
			await Promise.all(geocoded.map(async ({ key, label }) => {
				if (!label) {
					console.warn(`No geocode result for ${key}`);
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
				} catch (updateErr) {
					console.error(`Failed to update readableLocation for ${key}:`, updateErr.message);
					throw updateErr; // Re-throw to trigger re-queue
				}
			}));
		} catch (error) {
			console.error("Error processing geocode batch:", error.message);
			throw error;
		}
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
	maxRatePerSecond: 45,
	batchSize: 10
});
