import { WebSocketServer } from "ws";
import { WS_NEARBY, WS_NEARBY_CLOSE, WS_NEARBY_OPEN, WS_UPLOAD, WS_UPLOAD_OPEN } from "../constants.js";

class WebSocketManager {
	constructor(server) {
		this.wss = new WebSocketServer({ server });
		// Map of userId (Cognito sub ID) -> Map<websocket type, WebSocket>
		this.wsClients = new Map();
		this.acceptedOps = new Set([
			WS_UPLOAD_OPEN,
			WS_NEARBY_OPEN,
			WS_NEARBY_CLOSE
		]);
		this.opPairs = new Map([
			[WS_NEARBY_OPEN, WS_NEARBY_CLOSE]
		]);
		this.opMap = new Map([
			[WS_UPLOAD_OPEN, WS_UPLOAD],
			[WS_NEARBY_OPEN, WS_NEARBY],
			[WS_UPLOAD, WS_UPLOAD],
			[WS_NEARBY, WS_NEARBY]
		]);
		this.subscriptions = new Map([]);
		this.setup();
	}

	setup() {
		const heartbeat = function () {
			this.isAlive = true;
		};

		this.wss.on("connection", (ws, req) => {
			ws.isAlive = true;
			ws.on("pong", heartbeat);

			// The only message the client should be sending is a connect message, 
			// since in all cases it's just the server updating the client in realtime, not the other way around
			ws.on("message", (msg) => {
				try {
					const data = JSON.parse(msg);

					if (!this.acceptedOps.has(data.type)) {
						console.error("Invalid WS operation " + data.type);
						throw new Error("Invalid WS operation " + data.type);
					}

					ws.userID = data.userID;
					ws.openType = data.type;
					if (this.opPairs.has(ws.openType)) {
						ws.closeType = this.opPairs.get(ws.openType);
					}
					ws.connType = this.opMap.get(data.type);

					if (!this.wsClients.has(ws.userID)) {
						this.wsClients.set(ws.userID, new Map());
					}

					const userSockets = this.wsClients.get(ws.userID);
					if (!userSockets.get(this.opMap.get(data.type))) {
						userSockets.set(this.opMap.get(data.type), ws);
					}

					this.subscriptions.get(data.type).forEach(callback => callback(data));
				} catch (e) {
					ws.send(JSON.stringify({ type: "error", error: "Invalid message format" }));
				}
			});

			ws.on("close", () => {
				if (ws.connType && ws.userID && this.wsClients.has(ws.userID)) {
					this.wsClients.get(ws.userID).delete(ws.connType);
					if (this.wsClients.get(ws.userID).size === 0) {
						this.wsClients.delete(ws.userID);
					}
					
					if (this.subscriptions.has(ws.closeType)) {
						this.subscriptions.get(ws.closeType).forEach(callback => callback({ userID: ws.userID }));
					}
				}
			});
		});

		// Ping all clients every 30 seconds
		this.interval = setInterval(() => {
			this.wss.clients.forEach((ws) => {
				if (ws.isAlive === false) {
					if (ws.userID && this.wsClients.has(ws.userID)) {
						this.wsClients.get(ws.userID).delete(ws);
						if (this.wsClients.get(ws.userID).size === 0) {
							this.wsClients.delete(ws.userID);
						}
					}
					return ws.terminate();
				}
				ws.isAlive = false;
				ws.ping();
			});
		}, 30000);

		this.wss.on("close", () => {
			clearInterval(this.interval);
		});

		// Set up empty arrays for each operation subscription
		this.acceptedOps.forEach(val => {
			this.subscriptions.set(val, []);
		});
	}

	sendToUser(userID, socketID, payload) {
		let connection;
		try {
			connection = this.wsClients.get(userID).get(socketID);
		} catch (e) {
			console.error("Could not get connection with user", userID, "and socket ID", socketID);
			return;
		}

		if (connection) {
			if (connection.readyState === connection.OPEN) {
				connection.send(JSON.stringify(payload));
			}
		}
	}

	// Broadcast to all clients
	broadcast(payload) {
		this.wss.clients.forEach((ws) => {
			if (ws.readyState === ws.OPEN) {
				ws.send(JSON.stringify(payload));
			}
		});
	}

	// Add a callback that runs when a connection event happens
	subscribe(connectionType, callback) {
		if (!this.acceptedOps.has(connectionType)) {
			throw new Error("Invalid connection type " + connectionType);
		}

		const subs = this.subscriptions.get(connectionType);
		subs.push(callback);
		this.subscriptions.set(connectionType, subs);
	}
}

let websocketManager = null;
export function initWebSocket(server) {
	websocketManager = new WebSocketManager(server);
	return websocketManager;
}
export function getWebSocketManager() {
	return websocketManager;
}
