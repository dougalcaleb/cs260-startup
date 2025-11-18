import { Router } from "express";
import { requireAuth } from "../common/cognitoAuth.js";
import { USER_ACTIVE_TTL } from "../config.js";
import { getDB } from "../common/mongodb.js";

const router = Router();

function isActive(activeAt) {
	return (Math.floor(Date.now() / 1000) - activeAt) < USER_ACTIVE_TTL;
}

// Ensures the user has an entry in the db, creates one if not
// Also sets the user as "active"
router.post("/login", requireAuth, async (req, res) => {
	const db = getDB();
	const usersCollection = db.collection('users');

	let existingUser;
	try {
		existingUser = await usersCollection.findOne({ uid: req.body.uuid });
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	const username = existingUser?.username || req.body.username;

	try {
		await usersCollection.updateOne(
			{ uid: req.body.uuid },
			{
				$set: {
					username,
					activeAt: Math.floor(Date.now() / 1000)
				}
			},
			{ upsert: true }
		);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	res.json({ message: "Login successful" });
});

router.post("/set-username", requireAuth, async (req, res) => {
	const db = getDB();
	const usersCollection = db.collection('users');

	try {
		await usersCollection.updateOne(
			{ uid: req.body.uuid },
			{
				$set: {
					username: req.body.username,
					activeAt: Math.floor(Date.now() / 1000)
				}
			},
			{ upsert: true }
		);
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	res.json({ message: "Username update successful" });
});

router.post("/get-user", requireAuth, async (req, res) => {
	const db = getDB();
	const usersCollection = db.collection('users');

	let user;
	try {
		user = await usersCollection.findOne({ uid: req.body.uuid });
	} catch (e) {
		res.status(500).json({ error: e.message });
		return;
	}

	if (user) {
		res.json({
			username: user.username,
			isActive: isActive(user.activeAt)
		});
	} else {
		res.status(404).json({ error: "User not found" });
	}
});

export default router;