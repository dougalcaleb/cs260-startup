export const UNK_LOC = "Unknown Location";
export const UNK_TIME = "Unknown Date";

export function sortByLocation(images) {
	const sorted = {};

	images.forEach(img => {
		if (img.metadata.readableLocation) {
			ensurePath(sorted, [img.metadata.readableLocation], { location: img.metadata.readableLocation, images: [] });

			sorted[img.metadata.readableLocation].images.push(img);
		} else {
			ensurePath(sorted, [UNK_LOC], { location: UNK_LOC, images: [] });

			sorted[UNK_LOC].images.push(img);
		}
	});

	// Sort unknown to end, otherwise alphabetically descending
	return Object.values(sorted).sort((a, b) => {
		if (a.location === UNK_LOC) {
			return 1;
		} else if (b.location === UNK_LOC) {
			return -1;
		}

		return a.location.localeCompare(b.location);
	});
}

export function sortByTime(images) {
	const sorted = {};
	const dates = {};

	images.forEach(img => {
		if (img.metadata.timestamp) {
			const imgDate = new Date(img.metadata.timestamp * 1000);
			const imgYear = imgDate.getFullYear();
			const imgMonth = imgDate.getMonth();
			const imgDay = imgDate.getDate();

			ensurePath(dates, [imgYear, imgMonth, imgDay], []);

			dates[imgYear][imgMonth][imgDay].push(img);
		} else {
			ensurePath(sorted, [UNK_TIME], { time: UNK_TIME, images: [] });

			sorted[UNK_TIME].images.push(img);
		}
	});

	// Takes object of shape { year: { month: { day: [], ... }, ... }, ... } to { dateString: { dateString, images[] }, ... }
	Object.entries(dates).forEach(([year, months]) => {
		Object.entries(months).forEach(([month, days]) => {
			Object.entries(days).forEach(([day, dayImgs]) => {
				dayImgs.forEach(dayImg => {
					const dateString = new Date(year, month, day).toLocaleString("en-US", {
						weekday: "short",
						year: "numeric",
						month: "long",
						day: "numeric"
					});
					ensurePath(sorted, [dateString], { time: dateString, images: [] });

					sorted[dateString].images.push(dayImg);
				});
			});
		});
	});

	// Sort unknown to end, otherwise by date descending
	return Object.values(sorted).sort((a, b) => {
		if (a.time === UNK_TIME) {
			return 1;
		} else if (b.time === UNK_TIME) {
			return -1;
		}

		return new Date(a.time) > new Date(b.time);
	});;
}

function ensurePath(obj, path, final) {
	let created = false;
	let baseObj = obj;

	path.forEach(key => {
		if (!obj[key]) {
			obj[key] = {};
			created = true;
		}

		obj = obj[key];
	});

	if (created) {
		const finalKey = path.pop();
		let setObj = baseObj;

		path.forEach(key => { setObj = setObj[key]; });

		setObj[finalKey] = final;
	}
}