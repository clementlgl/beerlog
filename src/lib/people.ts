/** The two tasters. `key` matches the `rating*` / `comment*` beer fields. */
export type Person = { key: 1 | 2; name: string };

export const DEFAULT_PEOPLE: Person[] = [
	{ key: 1, name: 'Sébastien' },
	{ key: 2, name: 'Clément' }
];

/** Average of the ratings that are set; null when nobody rated. */
export function averageRating(r: { rating1: number | null; rating2: number | null }) {
	const set = [r.rating1, r.rating2].filter((x): x is number => x != null);
	return set.length ? set.reduce((a, b) => a + b, 0) / set.length : null;
}
