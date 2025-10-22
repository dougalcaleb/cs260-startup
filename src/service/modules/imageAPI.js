import { Router } from "express";
import { requireAuth, optionalAuth } from "../common/cognitoAuth.js";
import { BATCH_IMAGES, BUCKET_NAME, MAX_FILESIZE, SIGNED_URL_EXPIRE } from "../config.js";
import multer from "multer";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { formatFileSize } from "../common/util.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const router = Router();
const s3 = new S3Client({
	region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
});

// Multer setup with sane limits and image-only filter
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_FILESIZE,
		files: BATCH_IMAGES,
	},
	fileFilter: (req, file, cb) => {
		if (file.mimetype && file.mimetype.startsWith("image/")) return cb(null, true);
		cb(new Error("Only image uploads are allowed"));
	},
});

async function signURLs(keys) {
	if (!keys || !keys.length) {
		return [];
	}

	return await Promise.all(keys.map(async (Key) => {
		const command = new GetObjectCommand({
			Bucket: BUCKET_NAME,
			Key
		});

		return { url: await getSignedUrl(s3, command, { expiresIn: SIGNED_URL_EXPIRE }), key: Key } ;
	}));
}

router.get("/get-user-images", requireAuth, async (req, res) => {
	try {
		const data = await s3.send(new ListObjectsV2Command({
			Bucket: BUCKET_NAME,
			Prefix: `images/${req.user.username}/`,
			MaxKeys: 1000,
		}));

		let returnData = null;

		if (data.Contents) {
			returnData = await signURLs(data.Contents.map(c => c.Key));
		}

		res.json(returnData);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

router.post("/upload-single", requireAuth, upload.single("image"), async (req, res) => {
	try {
		const key = `images/${req.user.username}/${req.file.originalname}__${Date.now()}`;
		const uploader = new Upload({
			client: s3,
			params: {
				Bucket: BUCKET_NAME,
				Key: key,
				Body: req.file.buffer,
				ContentType: req.file.mimetype,
				CacheControl: "public, max-age=31536000, immutable", // doesn't do anything right now since URLS are unique every time, but maybe in the future?
			},
			queueSize: 4,
			partSize: 5 * 1024 * 1024, // 5MB
			leavePartsOnError: false,
		});
		await uploader.done();

		res.json({ message: "Upload successful", key });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

router.post("/upload-multiple", requireAuth, upload.array("images", BATCH_IMAGES), async (req, res) => {
	try {
		const uploadResults = await Promise.all(req.files.map(async file => {
			const key = `images/${req.user.username}/${file.originalname}__${Date.now()}`;
			const uploader = new Upload({
				client: s3,
				params: {
					Bucket: BUCKET_NAME,
					Key: key,
					Body: file.buffer,
					ContentType: file.mimetype,
					CacheControl: "public, max-age=31536000, immutable", // doesn't do anything right now since URLS are unique every time, but maybe in the future?
				},
				queueSize: 4,
				partSize: 5 * 1024 * 1024,
				leavePartsOnError: false,
			});
			await uploader.done();
			return key;
		}));

		res.json({ message: "Batch upload successful", keys: uploadResults });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Router-level error handler to catch Multer 413s and other errors
router.use((err, req, res, next) => {
	if (!err) return next();
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ error: `File too large. Max ${formatFileSize(MAX_FILESIZE)} per image.` });
	}
	return res.status(400).json({ error: err.message || 'Upload error' });
});

export default router;