import type { NewBeer } from './db/schema';
import { findStyle } from '#lib/styles.ts';

export type BeerFormValues = {
	barcode: string;
	name: string;
	brewery: string;
	style: string;
	abv: string;
	country: string;
	rating1: string;
	rating2: string;
	comment1: string;
	comment2: string;
	imageUrl: string;
};

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

export function readForm(f: FormData): BeerFormValues {
	return {
		barcode: str(f, 'barcode'),
		name: str(f, 'name'),
		brewery: str(f, 'brewery'),
		style: str(f, 'style'),
		abv: str(f, 'abv'),
		country: str(f, 'country'),
		rating1: str(f, 'rating1'),
		rating2: str(f, 'rating2'),
		comment1: str(f, 'comment1'),
		comment2: str(f, 'comment2'),
		imageUrl: str(f, 'imageUrl')
	};
}

/** Whole points from 1 to 10; null = not rated, undefined = invalid. */
function parseRating(s: string): number | null | undefined {
	if (!s) return null;
	const n = Number(s);
	return Number.isInteger(n) && n >= 1 && n <= 10 ? n : undefined;
}

/** Validate and convert to DB fields. Returns an error message or the fields. */
export function toFields(
	v: BeerFormValues
): { error: string } | { fields: Omit<NewBeer, 'createdAt' | 'updatedAt' | 'ratedAt1' | 'ratedAt2'> } {
	if (!v.name) return { error: 'Le nom est obligatoire.' };
	if (v.barcode && !/^\d{6,14}$/.test(v.barcode)) return { error: 'Code-barres invalide.' };
	const abv = v.abv ? Number(v.abv.replace(',', '.')) : null;
	if (abv !== null && (!Number.isFinite(abv) || abv < 0 || abv > 70))
		return { error: 'Degré d’alcool invalide.' };
	const style = v.style ? findStyle(v.style) : null;
	if (v.style && !style) return { error: 'Style inconnu.' };
	const rating1 = parseRating(v.rating1);
	const rating2 = parseRating(v.rating2);
	if (rating1 === undefined || rating2 === undefined) return { error: 'Note invalide.' };
	return {
		fields: {
			barcode: v.barcode || null,
			name: v.name,
			brewery: v.brewery || null,
			style: style?.name ?? null,
			abv,
			country: v.country || null,
			rating1,
			rating2,
			comment1: v.comment1 || null,
			comment2: v.comment2 || null
		}
	};
}

type Ratings = { rating1?: number | null; rating2?: number | null };
type RatingDates = { ratedAt1: Date | null; ratedAt2: Date | null };

/** Rating dates after a save: kept when a rating is unchanged, `now` when it is new or changed, null when cleared. */
export function ratingDates(next: Ratings, now: Date, prev?: Ratings & RatingDates): RatingDates {
	const date = (key: 1 | 2) => {
		const r = next[`rating${key}`];
		if (r == null) return null;
		return prev && prev[`rating${key}`] === r ? prev[`ratedAt${key}`] ?? now : now;
	};
	return { ratedAt1: date(1), ratedAt2: date(2) };
}
