import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const COGNITO_REGION = 'us-east-1';
const COGNITO_USER_POOL_ID = 'us-east-1_CeNWRAhjI';
const COGNITO_CLIENT_ID = '22rart6rc9f5arou9go82qi3rk';

// JWKS client to fetch Cognito's public keys
const client = jwksClient({
	jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
	cache: true,
	cacheMaxAge: 86400000, // 24 hours
});

// Helper to get Cognito public signing key
function getKey(header, callback) {
	client.getSigningKey(header.kid, (err, key) => {
		if (err) {
			callback(err);
		} else {
			const signingKey = key.getPublicKey();
			callback(null, signingKey);
		}
	});
}

// Helper to verify user token
export function verifyToken(token) {
	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			getKey,
			{
				issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
				audience: COGNITO_CLIENT_ID, // For id_token
				algorithms: ['RS256'],
			},
			(err, decoded) => {
				if (err) {
					reject(err);
				} else {
					resolve(decoded);
				}
			}
		);
	});
}

// Helper to verify access token
export function verifyAccessToken(token) {
	return new Promise((resolve, reject) => {
		jwt.verify(
			token,
			getKey,
			{
				issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
				algorithms: ['RS256'],
			},
			(err, decoded) => {
				if (err) {
					reject(err);
				} else {
					resolve(decoded);
				}
			}
		);
	});
}

// Middleware function to protect routes
// If successfully verified, attaches user data to request object
export function requireAuth(req, res, next) {
	const authHeader = req.headers.authorization;
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.status(401).json({ error: 'No token provided' });
	}

	const token = authHeader.substring(7); // Drop 'Bearer ' prefix

	// Try to verify as id_token first, then as access_token
	verifyToken(token)
		.then(decoded => {
			req.user = {
				sub: decoded.sub,
				username: decoded['cognito:username'] || decoded.username,
				email: decoded.email,
				name: decoded.name,
				...decoded,
			};
			next();
		})
		.catch(err => {
			// Try as access token if id_token verification fails
			verifyAccessToken(token)
				.then(decoded => {
					req.user = {
						sub: decoded.sub,
						username: decoded.username,
						...decoded,
					};
					next();
				})
				.catch(err => {
					console.error('Token verification failed:', err.message);
					return res.status(401).json({ error: 'Invalid or expired token' });
				});
		});
}

// Middleware function to optionally protect routes
// If user exists and is verified, attaches user data to request object
export function optionalAuth(req, res, next) {
	const authHeader = req.headers.authorization;
	
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		// No token provided, continue without user info
		return next();
	}

	const token = authHeader.substring(7);

	verifyToken(token)
		.then(decoded => {
			req.user = {
				sub: decoded.sub,
				username: decoded['cognito:username'] || decoded.username,
				email: decoded.email,
				name: decoded.name,
				...decoded,
			};
			next();
		})
		.catch(err => {
			verifyAccessToken(token)
				.then(decoded => {
					req.user = {
						sub: decoded.sub,
						username: decoded.username,
						...decoded,
					};
					next();
				})
				.catch(err => {
					// Invalid token, but continue anyway
					console.warn('Invalid token provided, continuing without auth');
					next();
				});
		});
}
