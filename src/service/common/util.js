// Human-readable file size formatter
// Examples:
//  - 0 -> "0 B"
//  - 800 -> "800 B"
//  - 2048 -> "2 KB"
//  - 1536000 -> "1.5 MB"
export function formatFileSize(bytes, fractionDigits = 1) {
    if (bytes === 0) return "0 B";
    if (typeof bytes !== "number" || !isFinite(bytes)) return "";
    if (bytes < 0) bytes = 0;

    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let unitIndex = 0;
    let value = bytes;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }

    // Use fewer decimals for larger numbers to keep it tidy
    const decimals = value >= 100 ? 0 : value >= 10 ? Math.min(fractionDigits, 1) : fractionDigits;
    return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

export function formatDate(timestamp) {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		weekday: "short",
		year: "numeric",
		month: "long",
		day: "numeric"
	});
}

// Returns either black or white (hex) for best contrast against given HSL.
const bestContrastTextColor = (h, s, l) => {
	// Convert HSL to RGB (0..1)
	const _s = s / 100;
	const _l = l / 100;
	const c = (1 - Math.abs(2 * _l - 1)) * _s;
	const hp = h / 60;
	const x = c * (1 - Math.abs((hp % 2) - 1));
	let r1 = 0, g1 = 0, b1 = 0;
	if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
	else if (hp < 2) { r1 = x; g1 = c; }
	else if (hp < 3) { g1 = c; b1 = x; }
	else if (hp < 4) { g1 = x; b1 = c; }
	else if (hp < 5) { r1 = x; b1 = c; }
	else { r1 = c; b1 = x; }
	const m = _l - c / 2;
	const r = r1 + m;
	const g = g1 + m;
	const b = b1 + m;
	
	// Relative luminance (WCAG algorithm)
	const lumBg = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	const contrastWhite = (Math.max(lumBg, 1) + 0.05) / (Math.min(lumBg, 1) + 0.05);
	const contrastBlack = (Math.max(lumBg, 0) + 0.05) / (Math.min(lumBg, 0) + 0.05);
	return contrastWhite >= contrastBlack ?  "hsl(0, 0%, 86%)" : "hsl(0, 0%, 10%)";
};

// Returns a pair of colors: one as a background color, and the corresponding contrast color (either black or white)
export function getRandomColorPair() {
	const randomHue = Math.random() * 360;
	return {
		main: `hsla(${randomHue}, 40%, 50%, 1)`,
		contrast: bestContrastTextColor(randomHue, 40, 50)
	}
}