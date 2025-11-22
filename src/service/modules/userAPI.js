import { Router } from "express";
import { requireAuth } from "../common/cognitoAuth.js";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { USER_TABLE } from "../config.js";
import { ddClient } from "../common/dynamodb.js";
import { getRandomColorPair } from "../common/util.js";
import { getWebSocketManager } from "../common/websocket.js";
import { WS_NEARBY_CLOSE, WS_NEARBY_OPEN } from "../constants.js";
import { getNearbyUsersManager } from "../common/nearbyUsers.js";

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
			profileColors: profileColorPair
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

export default router;