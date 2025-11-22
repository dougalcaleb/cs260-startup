import { WS_NEARBY_OPEN, WS_UPLOAD_OPEN } from "./constants";

const API_BASE_URL = import.meta.env.PROD 
	? 'https://startup.dougalcaleb.click' 
	: 'http://localhost:4000';
const acceptedWsTypes = new Set([
	WS_UPLOAD_OPEN,
	WS_NEARBY_OPEN
]);

/**
 * Make an authenticated API request
 * 
 * @param {string} endpoint - API endpoint (e.g., '/api/user/profile')
 * @param {object} options - Fetch options
 * @param {string} token - JWT token (id_token or access_token)
 * @returns Promise
 */
export async function authFetch(endpoint, token, options = {}) {
	if (!token) {
		throw new Error('User is not authenticated');
	}

	const isFormData = options && options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;

	const defaultOptions = {
		headers: {
			...(isFormData ? {} : { 'Content-Type': 'application/json' }),
			'Authorization': `Bearer ${token}`,
			...options.headers,
		},
	};

	const mergedOptions = {
		...options,
		headers: defaultOptions.headers,
	};

	const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);

	if (response.status === 401) {
		throw new Error('Unauthorized - token may be expired');
	}

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || error.message || 'Request failed');
	}

	return response.json();
}

/**
 * Make an authenticated POST call
 * 
 * @param {string} endpoint - API endpoint (must start with '/')
 * @param {string} token - JWT token
 * @param {string|File|Blob} body - POST body
 * @param {object} options - Additional fetch options
 * @returns Promise
 */
export async function authPost(endpoint, token, body, options = {}) {
	if (Object.getPrototypeOf(body) === Object.prototype) {
		body = JSON.stringify(body);
	}

	return authFetch(endpoint, token, {
		...options,
		body,
		method: "POST"
	});
}

/**
 * Make an authenticated GET call
 * 
 * @param {string} endpoint - API endpoint (must start with a '/')
 * @param {string} token - JWT token
 * @param {object} options - Additional fetch options
 * @returns Promise
 */
export async function authGet(endpoint, token, options = {}) {
	return authFetch(endpoint, token, {
		...options,
		method: "GET"
	});
}

/**
 * Make a public API request (no authentication)
 */
export async function publicFetch(endpoint, options = {}) {
	const defaultOptions = {
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	};

	const mergedOptions = {
		...options,
		headers: defaultOptions.headers,
	};

	const response = await fetch(`${API_BASE_URL}${endpoint}`, mergedOptions);

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || error.message || 'Request failed');
	}

	return response.json();
}

/**
 * Open a WebSocket connection
 * 
 * @param {string} typeID - WS type constant (WS_UPLOAD_OPEN or WS_NEARBY_OPEN)
 * @param {string} uuid - User's UUID (Cognito sub)
 * @returns {WebSocket} WebSocket instance
 */
export function openWS(typeID, uuid) {
	if (!acceptedWsTypes.has(typeID)) {
		throw new Error("Invalid WS type: " + typeID);
	}

	if (!uuid) {
		throw new Error("UUID is required for WebSocket connection");
	}

	const wsScheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
	const wsHost = import.meta.env.PROD 
		? 'startup.dougalcaleb.click' 
		: 'localhost:4000';
	
	const ws = new WebSocket(`${wsScheme}://${wsHost}`);

	ws.addEventListener("open", () => {
		// Register this connection with the server
		ws.send(JSON.stringify({ type: typeID, userID: uuid }));
	});

	ws.addEventListener("error", (error) => {
		console.error('WebSocket error:', error);
	});

	ws.addEventListener("close", (event) => {
		console.log('WebSocket closed:', event.code, event.reason);
	});

	return ws;
}