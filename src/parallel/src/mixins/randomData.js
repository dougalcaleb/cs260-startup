export const locations = [
	"Seattle, WA",
	"New York, NY",
	"Dallas, TX",
	"Knoxville, TN",
	"Los Angeles, CA",
	"Chicago, IL",
	"Houston, TX",
	"Phoenix, AZ",
	"Philadelphia, PA",
	"San Antonio, TX",
	"San Diego, CA",
	"Denver, CO",
	"Boston, MA",
	"Miami, FL",
	"London, UK",
	"Paris, France",
	"Tokyo, Japan",
	"Sydney, Australia",
	"Toronto, Canada",
	"Mexico City, Mexico",
	"Berlin, Germany",
	"Singapore",
	"Dubai, UAE",
	"Bangkok, Thailand"
];

export const dates = [

];

export function getRandomLocation() {
	return locations[Math.floor(Math.random() * locations.length)];
}

export function getRandomTimestamp() {
	const jan1_2000 = new Date(2000, 0, 1).getTime() / 1000; // Unix timestamp in seconds
	const today = Math.floor(Date.now() / 1000); // Current time in seconds
	return Math.floor(Math.random() * (today - jan1_2000)) + jan1_2000;
}

// Returns firstValue with probability chance (0-1), otherwise secondValue
export function pickByChance(chance, firstValue, secondValue) {
	const clamped = Math.min(Math.max(chance, 0), 1);
	return Math.random() < clamped ? firstValue : secondValue;
}
