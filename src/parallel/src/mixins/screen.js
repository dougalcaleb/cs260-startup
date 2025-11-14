export function isMobileScreen() {
	return window.innerWidth <= 640;
}

export function isMobileDevice() {
	const userAgent = navigator.userAgent || navigator.vendor || window.opera;
	
	// Check for mobile device patterns in user agent
	return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
}