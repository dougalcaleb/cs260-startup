import { Router } from "express";
import { requireAuth } from "../common/cognitoAuth.js";
import { GetCommand, PutCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { SUMMARY_TABLE, USER_TABLE } from "../config.js";
import { ddClient } from "../common/dynamodb.js";
import { getRandomColorPair } from "../common/util.js";
import { getWebSocketManager } from "../common/websocket.js";
import { QUEUE_ADD_LOC_KEY, WS_NEARBY_CLOSE, WS_NEARBY_OPEN } from "../constants.js";
import { getNearbyUsersManager } from "../common/nearbyUsers.js";
import { geocodeQueue } from "../common/geocodeQueue.js";

const router = Router();
const wsManager = getWebSocketManager();
const nuManager = getNearbyUsersManager();

// Ensures the user has an entry in the db, creates one if not
router.post("/login", requireAuth, async (req, res) => {
	const getCommand = new GetCommand({
		TableName: USER_TABLE,
		Key: {
			uid: req.body.uuid
		}
	});

	let getResponse;
	try {
		getResponse = await ddClient.send(getCommand);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	const username = Boolean(getResponse?.Item)
		? getResponse.Item.username
		: req.body.username;
	
	const profileColorPair = Boolean(getResponse?.Item?.profileColors)
		? getResponse?.Item?.profileColors
		: getRandomColorPair();

	const updateCommand = new PutCommand({
		TableName: USER_TABLE,
		Item: {
			uid: req.body.uuid,
			username,
			profileColors: profileColorPair,
			picture: req.body.picture || null
		}
	});

	try {
		const response = await ddClient.send(updateCommand);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	res.json({ message: "Login successful" });
});

router.post("/set-username", requireAuth, async (req, res) => {
	const updateCommand = new UpdateCommand({
		TableName: USER_TABLE,
		Key: { uid: req.body.uuid },
		UpdateExpression: 'SET #username = :username',
		ExpressionAttributeNames: { '#username': 'username' },
		ExpressionAttributeValues: { ':username': req.body.username }
	});

	try {
		await ddClient.send(updateCommand);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	res.json({ message: "Username update successful" });
});

router.post("/get-user", requireAuth, async (req, res) => {
	const getCommand = new GetCommand({
		TableName: USER_TABLE,
		Key: {
			uid: req.body.uuid
		}
	});

	let getResponse;
	try {
		getResponse = await ddClient.send(getCommand);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	if (getResponse.Item) {
		res.json({
			username: getResponse.Item.username,
			profileColors: getResponse.Item.profileColors
		});
	} else {
		res.status(404).json({ error: "User not found" });
	}
});

router.get("/get-user-summary", requireAuth, async (req, res) => {
	let summaryData;
	try {
		summaryData = await ddClient.send(new GetCommand({
			TableName: SUMMARY_TABLE,
			Key: {
				uid: req.user.sub
			}
		}));
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	if (summaryData.Item) {
		res.json(summaryData.Item);
	} else {
		res.status(404).json({ error: "User not found" });
	}
});

router.get("/get-all-users", requireAuth, async (req, res) => {
	const result = {};
	let lastEvaluatedKey;

	try {
		do {
			const resp = await ddClient.send(new ScanCommand({
				TableName: USER_TABLE,
				ProjectionExpression: "uid, #un, #pic, #pc",
				ExpressionAttributeNames: { "#un": "username", "#pic": "picture", "#pc": "profileColors" },
				ExclusiveStartKey: lastEvaluatedKey
			}));

			if (resp.Items?.length) {
				for (const item of resp.Items) {
					if (item.uid !== undefined && item.username !== undefined) {
						result[item.uid] = {
							username: item.username,
							profileColors: item.profileColors,
							picture: item.picture || null
						};
					}
				}
			}

			lastEvaluatedKey = resp.LastEvaluatedKey;
		} while (lastEvaluatedKey); // wow, a do-while. This is best practice apparently because of pagination from Dynamo
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	res.json(result);
});

router.post("/add-location", requireAuth, async (req, res) => {
	try {
		const { lat, lng } = req.body || {};

		const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
		const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;

		if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
			return res.status(400).json({ error: "Missing or invalid 'lat'/'lng' in request body" });
		}

		const geocodeComplete = (result) => {
			summaryQueue.enqueue(req.user.sub, null, result, () => {
				const userSockets = wsManager.wsClients.get(req.user.sub);
				if (userSockets) {
					const updateSocket = userSockets.get(WS_ADD_LOC);
					if (updateSocket && updateSocket.readyState === updateSocket.OPEN) {
						console.log(`Closing Location Update WebSocket for user ${userId} - update completed`);
						updateSocket.close(1000, 'Job completed');
					}
				}
			});
			wsManager.sendToUser(req.user.sub, WS_ADD_LOC, {
				type: WS_GEOCODE_UPDATE,
				result
			});
		}

		geocodeQueue.enqueue(`${QUEUE_ADD_LOC_KEY}-${req.user.sub}`, latNum, lngNum, req.user.sub, geocodeComplete);

		res.status(200);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}
});

router.post("/set-locations", requireAuth, async (req, res) => {
	try {
		const summaryData = await ddClient.send(new GetCommand({
			TableName: SUMMARY_TABLE,
			Key: {
				uid: req.user.sub
			}
		}));

		let locSummary = new Set();

		req.body.locations.forEach(loc => {
			locSummary.add(loc);
		});

		await ddClient.send(new PutCommand({
			TableName: SUMMARY_TABLE,
			Item: {
				uid: req.user.sub,
				locations: JSON.stringify(Array.from(locSummary)),
				dates: summaryData.Item?.dates || "[]"
			}
		}));

		res.status(200);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}
});

export default router;