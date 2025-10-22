const API_BASE_URL = import.meta.env.PROD 
	? 'https://startup.dougalcaleb.click' 
	: 'http://localhost:4000';

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
