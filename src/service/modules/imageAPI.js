import { Router } from "express";
import { requireAuth, optionalAuth } from "../common/cognitoAuth.js";
import { BATCH_IMAGES, BUCKET_NAME, MAX_FILESIZE, MDATA_TABLE, SERVER_REGION, SIGNED_URL_EXPIRE } from "../config.js";
import multer from "multer";
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { formatDate, formatFileSize } from "../common/util.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ddClient } from "../common/dynamodb.js";
import { PutCommand, BatchGetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import exifr from "exifr";
import { geocodeQueue } from "../common/geocodeQueue.js";
import { summaryQueue } from "../common/summaryQueue.js";

const router = Router();
const s3 = new S3Client({
	region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || SERVER_REGION,
});

// Extract and store image metadata (with exif library)
async function extractAndStoreMetadata(buffer, key, userID) {
	const metadata = await exifr.parse(buffer, { gps: true, exif: true, xmp: false, icc: false, iptc: false });

	// Extract timestamp
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
	const dateString = timestamp ? formatDate(timestamp * 1000) : null;
	if (metadata?.latitude && metadata?.longitude) {
		location = {
			lat: metadata.latitude,
			lng: metadata.longitude
		};
		
		// Add to geocode queue for async processing
		geocodeQueue.enqueue(key, location.lat, location.lng, userID, (result) => summaryQueue.enqueue(userID, dateString, result));
	} else {
		summaryQueue.enqueue(userID, dateString);
	}
	
	// Store metadata without readableLocation (will be filled by queue)
	const updateCommand = new PutCommand({
		TableName: MDATA_TABLE,
		Item: {
			uid: key,
			location,
			readableLocation: null, // Will be populated by geocode queue
			timestamp
		}
	});

	await ddClient.send(updateCommand);

	return { location, timestamp };
}

// Multer setup (for uploading images)
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

// Gets public signed URLs for images in the s3 bucket
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

// Retrieves the metadata for a set of images from DynamoDB
async function getMetadataForImages(keys) {
	if (!keys || !keys.length) {
		return {};
	}

	// DynamoDB BatchGet has a limit of 100 items per request
	const batchSize = 100;
	const batches = [];
	
	for (let i = 0; i < keys.length; i += batchSize) {
		batches.push(keys.slice(i, i + batchSize));
	}

	const allMetadata = {};

	for (const batch of batches) {
		const batchGetCommand = new BatchGetCommand({
			RequestItems: {
				[MDATA_TABLE]: {
					Keys: batch.map(key => ({ uid: key }))
				}
			}
		});

		try {
			const response = await ddClient.send(batchGetCommand);
			if (response.Responses && response.Responses[MDATA_TABLE]) {
				response.Responses[MDATA_TABLE].forEach(item => {
					allMetadata[item.uid] = {
						location: item.location || null,
						readableLocation: item.readableLocation || null,
						timestamp: item.timestamp || null
					};
				});
			}
		} catch (error) {
			console.error(`Failed to fetch metadata batch:`, error.message);
			// Continue with other batches even if one fails
		}
	}

	return allMetadata;
}

const getImages = async (id) => {
	const data = await s3.send(new ListObjectsV2Command({
		Bucket: BUCKET_NAME,
		Prefix: `images/${id}/`,
		MaxKeys: 1000,
	}));

	let returnData = null;

	if (data.Contents) {
		const keys = data.Contents.map(c => c.Key);
		
		// Get signed URLs and metadata in parallel
		const [signedUrls, metadata] = await Promise.all([
			signURLs(keys),
			getMetadataForImages(keys)
		]);

		returnData = signedUrls.map(item => ({
			...item,
			metadata: metadata[item.key] || { location: null, readableLocation: null, timestamp: null }
		}));
	}

	return returnData;
}

// Gets images for the logged-in user
router.get("/get-user-images", requireAuth, async (req, res) => {
	try {
		const returnData = await getImages(req.user.sub);
		res.json(returnData || []);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Gets images that are not the logged-in user's (for comparing)
router.post("/get-user-images", requireAuth, async (req, res) => {
	try {
		const returnData = await getImages(req.body.userID);
		res.json(returnData || []);
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

router.post("/upload-single", requireAuth, upload.single("image"), async (req, res) => {
	const key = `images/${req.user.sub}/${req.file.originalname}__${Date.now()}`;

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
		const metadata = await extractAndStoreMetadata(req.file.buffer, key, req.user.sub);
		res.json({ message: "Upload successful", key, metadata });
	} catch (e) {
		res.status(500).json({ error: "Metadata upload error: " + e.message });
	}		
});

router.post("/upload-multiple", requireAuth, upload.array("images", BATCH_IMAGES), async (req, res) => {
	try {
		const uploadResults = await Promise.all(req.files.map(async file => {
			const key = `images/${req.user.sub}/${file.originalname}__${Date.now()}`;
			
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

			let metadata = null;
			try {
				metadata = await extractAndStoreMetadata(file.buffer, key, req.user.sub);
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
		const userPrefix = `images/${req.user.sub}/`;
		if (!key.startsWith(userPrefix)) {
			return res.status(403).json({ error: "Forbidden: cannot delete objects outside your namespace" });
		}

		await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));

		return res.json({ message: "Delete successful", key });
	} catch (e) {
		res.status(500).json({ error: e.message });
	}
});

// Manually set image location (for images without GPS EXIF)
router.post("/set-location", requireAuth, async (req, res) => {
	try {
		const { key, lat, lng } = req.body || {};

		if (!key || typeof key !== "string") {
			return res.status(400).json({ error: "Missing or invalid 'key' in request body" });
		}

		const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
		const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;

		if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
			return res.status(400).json({ error: "Missing or invalid 'lat'/'lng' in request body" });
		}

		// Update raw coordinates and clear readableLocation (will be set by geocode queue)
		await ddClient.send(new UpdateCommand({
			TableName: MDATA_TABLE,
			Key: { uid: key },
			UpdateExpression: 'SET #loc = :loc, readableLocation = :null',
			ExpressionAttributeNames: { '#loc': 'location' },
			ExpressionAttributeValues: {
				':loc': { lat: latNum, lng: lngNum },
				':null': null
			}
		}));

		// Enqueue for readable address resolution and websocket update
		geocodeQueue.enqueue(key, latNum, lngNum, req.user.sub, (result) => summaryQueue.enqueue(req.user.sub, null, result));

		return res.json({ message: "Location set", key, location: { lat: latNum, lng: lngNum } });
	} catch (e) {
		return res.status(500).json({ error: e.message });
	}
});

// Manually set (or override) image date (timestamp) when EXIF time missing/incorrect
router.post("/set-date", requireAuth, async (req, res) => {
	try {
		const { key, year, month, day, timestamp } = req.body || {};

		if (!key || typeof key !== "string") {
			return res.status(400).json({ error: "Missing or invalid 'key' in request body" });
		}

		// Ensure user only updates own images
		const userPrefix = `images/${req.user.sub}/`;
		if (!key.startsWith(userPrefix)) {
			return res.status(403).json({ error: "Forbidden: cannot modify images outside your namespace" });
		}

		let tsSeconds = null;
		if (Number.isFinite(timestamp)) {
			// Allow direct timestamp (seconds) if provided
			tsSeconds = Number(timestamp);
		} else {
			// Validate parts
			const y = Number(year);
			const m = Number(month);
			const d = Number(day);
			if (!Number.isInteger(y) || y < 1900 || y > 2100) {
				return res.status(400).json({ error: "Invalid 'year'" });
			}
			if (!Number.isInteger(m) || m < 1 || m > 12) {
				return res.status(400).json({ error: "Invalid 'month'" });
			}
			const maxDay = new Date(y, m, 0).getDate();
			if (!Number.isInteger(d) || d < 1 || d > maxDay) {
				return res.status(400).json({ error: "Invalid 'day'" });
			}
			tsSeconds = Math.floor(new Date(y, m - 1, d).getTime() / 1000);
		}

		await ddClient.send(new UpdateCommand({
			TableName: MDATA_TABLE,
			Key: { uid: key },
			UpdateExpression: 'SET #ts = :ts',
			ExpressionAttributeNames: { '#ts': 'timestamp' },
			ExpressionAttributeValues: { ':ts': tsSeconds }
		}));

		// Enqueue summary update (no geocode here). Pass date string for summary aggregation.
		const dateString = tsSeconds ? formatDate(tsSeconds * 1000) : null;
		summaryQueue.enqueue(req.user.sub, dateString);

		return res.json({ message: 'Date set', key, timestamp: tsSeconds });
	} catch (e) {
		return res.status(500).json({ error: e.message });
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