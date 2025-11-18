import { MongoClient } from 'mongodb';
import { MONGO_TABLE, MONGO_URI } from '../config.js';

let client;
let db;

export async function connectToMongoDB() {
	if (db) {
		return db;
	}

	try {
		client = new MongoClient(`mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${MONGO_URI}`);
		await client.connect();
		db = client.db(MONGO_TABLE);
		console.log('Connected to MongoDB');
		return db;
	} catch (error) {
		console.error('Failed to connect to MongoDB:', error);
		throw error;
	}
}

export function getDB() {
	if (!db) {
		throw new Error('Database not initialized.');
	}
	return db;
}

export async function closeMongoDB() {
	if (client) {
		await client.close();
		client = null;
		db = null;
		console.log('MongoDB connection closed');
	}
}
