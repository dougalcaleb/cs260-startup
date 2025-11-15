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
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
	});
}

export function formatMetadata(data) {
	if (!data) {
		return { none: "No data" };
	}

	let loc = data?.metadata?.readableLocation ?? '';
	let time = parseInt(data?.metadata?.timestamp)
		? formatDate(parseInt(data?.metadata?.timestamp) * 1000)
		: "";
	
	if (!loc && !time) {
		return { none: "No data" };
	}

	return { loc, time };
}