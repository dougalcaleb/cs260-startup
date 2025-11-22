import 'dotenv/config';
import express from "express";
import http from "http";
import { initWebSocket } from "./common/websocket.js";
import cookieParser from "cookie-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import imageAPI from "./modules/imageAPI.js";
import userAPI from "./modules/userAPI.js";
import userAPIMongo from "./modules/userAPIMongo.js";
import { geocodeQueue } from "./common/geocodeQueue.js";
import { summaryQueue } from './common/summaryQueue.js';
import { connectToMongoDB } from './common/mongodb.js';
import { initNearbyUsersManager } from './common/nearbyUsers.js';
import { WS_NEARBY_CLOSE, WS_NEARBY_OPEN } from './constants.js';

const app = express();
const server = http.createServer(app);
const port = process.argv.length > 2 ? process.argv[2] : 4000;

// Enable CORS
app.use((req, res, next) => {
	const origin = req.headers.origin;
	if (origin === 'http://localhost:5173' || origin === 'https://startup.dougalcaleb.click') {
		res.setHeader('Access-Control-Allow-Origin', origin);
	}
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Credentials', 'true');
	
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

// Generic middleware
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static('public'));

// Image endpoints
app.use("/api/image", imageAPI);
app.use("/api/user", userAPI);
// app.use("/api/mongo/user", userAPIMongo);

// SPA fallback: send index.html for non-API routes so client-side routing works
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.get(/^\/(?!api).*/, (_req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// WebSocket setup
const websocketManager = initWebSocket(server);
const nearbyUsersManager = initNearbyUsersManager();

websocketManager.subscribe(WS_NEARBY_OPEN, (sdata) => {
	nearbyUsersManager.userConnected(sdata.userID);
});

websocketManager.subscribe(WS_NEARBY_CLOSE, (sdata) => {
	nearbyUsersManager.userDisconnected(sdata.userID);
});

// Init mongo atlas connection
// connectToMongoDB().catch(err => {
// 	console.error('Failed to connect to MongoDB:', err);
// 	process.exit(1);
// });

// Start server
server.listen(port, () => {
	console.log(`Server listening on port ${port}`);
	console.log('Geocode queue initialized:', geocodeQueue.getStatus());
	console.log('Summary queue initialized:', summaryQueue.getStatus());
});