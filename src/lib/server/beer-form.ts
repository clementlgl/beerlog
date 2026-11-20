import type { NewBeer } from './db/schema';

export type BeerFormValues = {
	barcode: string;
	name: string;
	brewery: string;
	style: string;
	abv: string;
	country: string;
	rating: string;
	comment: string;
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
		rating: str(f, 'rating'),
		comment: str(f, 'comment'),
		imageUrl: str(f, 'imageUrl')
	};
}

/** Validate and convert to DB fields. Returns an error message or the fields. */
export function toFields(
	v: BeerFormValues
): { error: string } | { fields: Omit<NewBeer, 'createdBy' | 'createdAt' | 'updatedBy' | 'updatedAt'> } {
	if (!v.name) return { error: 'Le nom est obligatoire.' };
	if (v.barcode && !/^\d{6,14}$/.test(v.barcode)) return { error: 'Code-barres invalide.' };
	const abv = v.abv ? Number(v.abv.replace(',', '.')) : null;
	if (abv !== null && (!Number.isFinite(abv) || abv < 0 || abv > 70))
		return { error: 'Degré d’alcool invalide.' };
	const rating = v.rating ? Number(v.rating) : null;
	if (rating !== null && !(Number.isInteger(rating) && rating >= 1 && rating <= 10))
		return { error: 'Note invalide.' };
	return {
		fields: {
			barcode: v.barcode || null,
			name: v.name,
			brewery: v.brewery || null,
			style: v.style || null,
			abv,
			country: v.country || null,
			rating,
			comment: v.comment || null
		}
	};
}
