import express from "express";
import cookieParser from "cookie-parser";
import imageAPI from "./modules/imageAPI.js";

const app = express();

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

// Start server
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});