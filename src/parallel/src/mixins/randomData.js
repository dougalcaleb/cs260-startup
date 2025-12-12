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