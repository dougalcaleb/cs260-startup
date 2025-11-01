import { Router } from "express";
import { requireAuth } from "../common/cognitoAuth.js";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { USER_ACTIVE_TTL, USER_TABLE } from "../config.js";
import { ddClient } from "../common/dynamodb.js";

const router = Router();

function isActive(activeAt) {
	return (Math.floor(Date.now() / 1000) - activeAt) < USER_ACTIVE_TTL;
}

// Ensures the user has an entry in the db, creates one if not
// Also sets the user as "active"
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

	const updateCommand = new PutCommand({
		TableName: USER_TABLE,
		Item: {
			uid: req.body.uuid,
			username,
			activeAt: Math.floor(Date.now() / 1000)
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
	const updateCommand = new PutCommand({
		TableName: USER_TABLE,
		Item: {
			uid: req.body.uuid,
			username: req.body.username,
			activeAt: Math.floor(Date.now() / 1000)
		}
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
			isActive: isActive(getResponse.Item.activeAt)
		});
	} else {
		res.status(404).json({ error: "User not found" });
	}
});

export default router;