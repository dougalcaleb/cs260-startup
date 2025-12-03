function levenshteinDistance(a, b) {
	if (a === b) return 0;
	if (!a) return b.length;
	if (!b) return a.length;

	const dp = Array(b.length + 1).fill(0);
	for (let j = 0; j <= b.length; j++) dp[j] = j;

	for (let i = 1; i <= a.length; i++) {
		let prev = dp[0];
		dp[0] = i;
		for (let j = 1; j <= b.length; j++) {
			const temp = dp[j];
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			dp[j] = Math.min(
				dp[j] + 1, // deletion
				dp[j - 1] + 1, // insertion
				prev + cost // substitution
			);
			prev = temp;
		}
	}
	return dp[b.length];
}

export function similarity(a, b) {
	const dist = levenshteinDistance(a, b);
	const maxLen = Math.max(a.length, b.length);
	return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/**
 * Find usernames similar to a query.
 * @param {string[]} usernames
 * @param {string} query
 * @param {number} threshold - 0..1 (e.g., 0.7)
 * @param {number} [limit] - optional max results
 */
export function findSimilarUsernames(usernames, query, threshold = 0.7, limit) {
	const q = query.trim().toLowerCase();

	const scored = usernames
		.map((u) => {
			const s = similarity(q, String(u).toLowerCase());
			return {username: u, score: s};
		})
		.filter((x) => x.score >= threshold)
		.sort((a, b) => b.score - a.score);

	return typeof limit === "number" ? scored.slice(0, limit) : scored;
}

// Example usage:
const users = ["caleb", "kaleb", "cable", "celebrant", "alice", "bob"];
console.log(findSimilarUsernames(users, "caleb", 0.7));
// => [{ username: "caleb", score: 1 }, { username: "kaleb", score: 0.8 }, { username: "cable", score: ... }]
// ...existing code...
