import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { SUMMARY_TABLE, USER_TABLE } from "../config.js";
import { ddClient } from "./dynamodb.js";
import { getWebSocketManager } from "./websocket.js";
import { WS_NEARBY_USER_CONNECT, WS_NEARBY_USER_DISCONNECT } from "../constants.js";

class NearbyUsers {
	constructor() {
		this.connectedUsers = new Map();
		this.socket = getWebSocketManager();
	}

	async userConnected(userID) {
		if (this.connectedUsers.has(userID)) return;

		let summaryData;
		let userData;
		try {
			summaryData = await ddClient.send(new GetCommand({
				TableName: SUMMARY_TABLE,
				Key: {
					uid: userID
				}
			}));
		} catch (e) {
			console.error("Failed to fetch summary data for user", userID);
			return;
		}

		try {
			userData = await ddClient.send(new GetCommand({
				TableName: USER_TABLE,
				Key: {
					uid: userID
				}
			}));
		} catch (e) {
			console.error("Failed to fetch user data for user", userID);
			return;
		}

		this.connectedUsers.set(userID, {
			locations: JSON.parse(summaryData.Item?.locations || "[]"),
			dates: JSON.parse(summaryData.Item?.dates || "[]"),
			username: userData.Item?.username || "[No username]"
		});

		this.socket.broadcast({
			type: WS_NEARBY_USER_CONNECT,
			data: Object.fromEntries(this.connectedUsers.entries())
		});
	}

	userDisconnected(userID) {
		if (!this.connectedUsers.has(userID)) return;

		this.connectedUsers.delete(userID);

		this.socket.broadcast({
			type: WS_NEARBY_USER_DISCONNECT,
			data: Object.fromEntries(this.connectedUsers.entries())
		});
	}
}

let NearbyUsersManager = null;
export function initNearbyUsersManager() {
	NearbyUsersManager = new NearbyUsers();
	console.log("Nearby Users manager set up");
	return NearbyUsersManager;
}
export function getNearbyUsersManager() {
	return NearbyUsersManager;
}
