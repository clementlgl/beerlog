/** The two tasters. `key` matches the `rating*` / `comment*` beer fields. */
export const PEOPLE = [
	{ key: 'Seb', name: 'Sébastien', short: 'Séb' },
	{ key: 'Clem', name: 'Clément', short: 'Clem' }
] as const;

export type PersonKey = (typeof PEOPLE)[number]['key'];

/** Average of the ratings that are set; null when nobody rated. */
export function averageRating(r: { ratingSeb: number | null; ratingClem: number | null }) {
	const set = [r.ratingSeb, r.ratingClem].filter((x): x is number => x != null);
	return set.length ? set.reduce((a, b) => a + b, 0) / set.length : null;
}
