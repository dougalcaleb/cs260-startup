import { ddClient } from "./dynamodb.js";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { SUMMARY_TABLE, SUMMARY_UPDATE_BATCH, SUMMARY_UPDATE_DELAY, SUMMARY_UPDATE_RATE } from "../config.js";

class SummaryQueue {
	constructor(options = {}) {
		this.queue = [];
		this.processing = false;
		this.willProcess = false;
		this.maxRatePerSecond = options.maxRatePerSecond || SUMMARY_UPDATE_RATE;
		this.batchSize = options.batchSize || SUMMARY_UPDATE_BATCH;
		this.processDelay = options.processDelay || SUMMARY_UPDATE_DELAY;
		this.processIntervalMs = Math.ceil((this.batchSize / this.maxRatePerSecond) * 1000);
	}

	/**
	 * Add a new job to the queue
	 */
	enqueue(userID, dateStr = "", locationStr = "") {
		if (!dateStr && !locationStr) return;
		
		const existingUpdate = this.queue.find(j => j.userID === userID);
		if (existingUpdate) {
			if (locationStr) {
				existingUpdate.locations = new Set([...Array.from(existingUpdate.locations), locationStr]);
			}
			if (dateStr) {
				existingUpdate.dates = new Set([...Array.from(existingUpdate.dates), dateStr]);
			}
			console.log(`Updated existing summary update job for ${userID}. Queue size: ${this.queue.length}`);
		} else {
			const dateSet = dateStr ? new Set([dateStr]) : new Set();
			const locSet = locationStr ? new Set([locationStr]) : new Set();
			this.queue.push({
				userID,
				locations: locSet,
				dates: dateSet
			});
			console.log(`Added summary update job for ${userID}. Queue size: ${this.queue.length}`);
		}

		// Start processing if not already running
		if (!this.processing && !this.willProcess) {
			this.willProcess = true;
			setTimeout(() => {
				this.startProcessing();
				this.willProcess = false;
			}, this.processDelay);
		}
	}

	/**
	 * Start processing the queue
	 */
	async startProcessing() {
		if (this.processing) return;
		
		this.processing = true;
		console.log("Starting summary update queue processor");

		while (this.queue.length > 0) {
			const batch = this.queue.splice(0, this.batchSize);
			console.log(`Processing batch of ${batch.length} summary update jobs. ${this.queue.length} remaining in queue.`);

			try {
				await this.processBatch(batch);
			} catch (error) {
				console.error("Batch summary update processing error:", error.message);
				// Re-queue failed items at the end
				this.queue.push(...batch);
			}

			// Wait to respect rate limit before processing next batch
			if (this.queue.length > 0) {
				await this.delay(this.processIntervalMs);
			}
		}

		this.processing = false;
		console.log("Summary update queue processor stopped - queue empty");
	}

	/**
	 * Process a set of jobs
	 * @param {Array} batch Array of jobs
	 */
	async processBatch(batch) {
		try {
			await Promise.all(batch.map(async ({ userID, locations, dates }) => {
				try {
					const summaryData = await ddClient.send(new GetCommand({
						TableName: SUMMARY_TABLE,
						Key: {
							uid: userID
						}
					}));

					let locSummary = new Set();
					let dateSummary = new Set();

					if (summaryData.Item) {
						locSummary = new Set(JSON.parse(summaryData.Item?.locations || "[]"));
						dateSummary = new Set(JSON.parse(summaryData.Item?.dates || "[]"));
					}

					locations.forEach(value => locSummary.add(value));
					dates.forEach(value => dateSummary.add(value));

					await ddClient.send(new PutCommand({
						TableName: SUMMARY_TABLE,
						Item: {
							uid: userID,
							locations: JSON.stringify(Array.from(locSummary)),
							dates: JSON.stringify(Array.from(dateSummary))
						}
					}))
				} catch (e) {
					console.error(`Failed to update summary data for ${userID}:`, e.message);
				}
			}));
			
		} catch (error) {
			console.error("Error processing summary update batch:", error.message);
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
			willProcess: this.willProcess,
			maxRatePerSecond: this.maxRatePerSecond,
			batchSize: this.batchSize,
			processIntervalMs: this.processIntervalMs
		};
	}
}

// Export a singleton instance
export const summaryQueue = new SummaryQueue({
	maxRatePerSecond: SUMMARY_UPDATE_RATE,
	batchSize: SUMMARY_UPDATE_BATCH,
	processDelay: SUMMARY_UPDATE_DELAY
});
