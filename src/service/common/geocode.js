import { Client } from "@googlemaps/google-maps-services-js";
import { GOOGLE_MAPS_API_KEY } from "../config.js";

const client = new Client({});

function extractComponent(components, types) {
	if (!Array.isArray(components)) return null;
	for (const t of types) {
		const comp = components.find(c => Array.isArray(c.types) && c.types.includes(t));
		if (comp) return comp;
	}
	return null;
}

function extractLocationPartsFromResults(results) {
	const out = { city: null, stateShort: null, stateLong: null, countryShort: null, countryLong: null, fallback: null };
	if (!Array.isArray(results) || results.length === 0) return out;

	for (const result of results) {
		const comps = result.address_components || [];
		const cityComp = extractComponent(comps, [
			"locality",
			"postal_town",
			"administrative_area_level_3",
			"administrative_area_level_2",
			"sublocality",
		]);
		const stateComp = extractComponent(comps, ["administrative_area_level_1"]);
		const countryComp = extractComponent(comps, ["country"]);

		if (cityComp && !out.city) out.city = cityComp.long_name || cityComp.short_name || null;
		if (stateComp && !out.stateShort) {
			out.stateShort = stateComp.short_name || null;
			out.stateLong = stateComp.long_name || null;
		}
		if (countryComp && !out.countryShort) {
			out.countryShort = countryComp.short_name || null;
			out.countryLong = countryComp.long_name || null;
		}
		if (out.city && out.stateShort && out.countryShort) break;
	}

	out.fallback = results[0]?.formatted_address || null;
	return out;
}

async function reverseGeocodeOne(lat, lng) {
	try {
		const resp = await client.reverseGeocode({
			params: {
				latlng: { lat, lng },
				key: GOOGLE_MAPS_API_KEY,
			},
			// timeout: 2000, // optional
		});
		const parts = extractLocationPartsFromResults(resp.data?.results || []);
		let label = null;
		if (parts.city) {
			if (parts.countryShort === 'US') {
				label = parts.stateShort ? `${parts.city}, ${parts.stateShort}` : parts.city;
			} else {
				label = parts.countryLong ? `${parts.city}, ${parts.countryLong}` : parts.city;
			}
		} else {
			label = parts.fallback;
		}
		return {
			city: parts.city || null,
			state: parts.stateShort || null,
			country: parts.countryLong || null,
			countryCode: parts.countryShort || null,
			label: label || null,
		};
	} catch (err) {
		const status = err?.response?.data?.status;
		const message = err?.response?.data?.error_message || err.message;
		console.error(`Google Reverse Geocode error (${status || 'unknown'}): ${message}`);
		throw err;
	}
}

export async function getGeocode(items) {
	if (!GOOGLE_MAPS_API_KEY) {
		throw new Error("Missing GOOGLE_MAPS_API_KEY environment variable");
	}
	if (!Array.isArray(items) || items.length === 0) return [];

	const chunkSize = 10; // be nice to the API
	const out = [];
	for (let i = 0; i < items.length; i += chunkSize) {
		const chunk = items.slice(i, i + chunkSize);
		const results = await Promise.all(chunk.map(async ({ key, lat, lng }) => {
			if (typeof lat !== "number" || typeof lng !== "number") {
				return { key, city: null, state: null, country: null, countryCode: null, label: null };
			}
			try {
				const info = await reverseGeocodeOne(lat, lng);
				return { key, ...info };
			} catch (e) {
				// Log and continue; caller can decide how to handle nulls
				console.error(`Reverse geocode failed for ${key ?? "<no-key>"}:`, e.message);
				return { key, city: null, state: null, country: null, countryCode: null, label: null };
			}
		}));
		out.push(...results);
	}
	return out;
}
