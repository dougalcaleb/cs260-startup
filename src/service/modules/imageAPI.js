import { Router } from "express";
import { requireAuth, optionalAuth } from "../common/cognitoAuth.js";
import { BATCH_IMAGES, BUCKET_NAME, MAX_FILESIZE, MDATA_TABLE, SIGNED_URL_EXPIRE } from "../config.js";
import multer from "multer";
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { formatFileSize } from "../common/util.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ddClient } from "../common/dynamodb.js";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import exifr from "exifr";

const router = Router();
const s3 = new S3Client({
	region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
});

// Extract and store image metadata (EXIF)
async function extractAndStoreMetadata(buffer, uid, key) {
	const metadata = await exifr.parse(buffer, { gps: true, exif: true, xmp: false, icc: false, iptc: false });

	// Extract timestamp (tries multiple EXIF fields)
	let timestamp = null;
	if (metadata?.DateTimeOriginal) {
		timestamp = Math.floor(new Date(metadata.DateTimeOriginal).getTime() / 1000);
	} else if (metadata?.CreateDate) {
		timestamp = Math.floor(new Date(metadata.CreateDate).getTime() / 1000);
	} else if (metadata?.ModifyDate) {
		timestamp = Math.floor(new Date(metadata.ModifyDate).getTime() / 1000);
	}
	
	// Extract GPS coordinates
	let location = null;
	if (metadata?.latitude && metadata?.longitude) {
		location = {
			lat: metadata.latitude,
			lng: metadata.longitude
		};
	}
	
	const updateCommand = new PutCommand({
		TableName: MDATA_TABLE,
		Item: {
			uid: key,
			location,
			timestamp
		}
	});

	await ddClient.send(updateCommand);

	return { location, timestamp };
}

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
	const key = `images/${req.user.username}/${req.file.originalname}__${Date.now()}`;

	try {
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
	} catch (e) {
		res.status(500).json({ error: "Image upload error: " + e.message });
	}

	try {
		const metadata = await extractAndStoreMetadata(req.file.buffer, req.body.uuid, key);
		res.json({ message: "Upload successful", key, metadata });
	} catch (e) {
		res.status(500).json({ error: "Metadata upload error: " + e.message });
	}		
});

router.post("/upload-multiple", requireAuth, upload.array("images", BATCH_IMAGES), async (req, res) => {
	try {
		const uploadResults = await Promise.all(req.files.map(async file => {
			const key = `images/${req.user.username}/${file.originalname}__${Date.now()}`;
			
			// Upload to S3
			const uploader = new Upload({
				client: s3,
				params: {
					Bucket: BUCKET_NAME,
					Key: key,
					Body: file.buffer,
					ContentType: file.mimetype,
					CacheControl: "public, max-age=31536000, immutable",
				},
				queueSize: 4,
				partSize: 5 * 1024 * 1024,
				leavePartsOnError: false,
			});
			await uploader.done();

			// Extract and store metadata
			let metadata = null;
			try {
				metadata = await extractAndStoreMetadata(file.buffer, req.body.uuid, key);
			} catch (metadataError) {
				console.error(`Metadata extraction failed for ${key}:`, metadataError.message);
				// Continue batch even if metadata extraction fails
			}

			return { key, metadata };
		}));

		res.json({ message: "Batch upload successful", results: uploadResults });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

router.post("/delete-single", requireAuth, async (req, res) => {
	try {
		const { key } = req.body || {};

		if (!key || typeof key !== "string") {
			return res.status(400).json({ error: "Missing or invalid 'key' in request body" });
		}

		// Ensure users can only delete within their own folder
		const userPrefix = `images/${req.user.username}/`;
		if (!key.startsWith(userPrefix)) {
			return res.status(403).json({ error: "Forbidden: cannot delete objects outside your namespace" });
		}

		await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));

		// S3 delete is idempotent; consider it success even if the key didn't exist
		return res.json({ message: "Delete successful", key });
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