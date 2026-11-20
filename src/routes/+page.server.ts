import { desc } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const b = schema.beers;
	const beers = db
		.select({
			id: b.id,
			name: b.name,
			brewery: b.brewery,
			style: b.style,
			abv: b.abv,
			country: b.country,
			photo: b.photo,
			rating: b.rating,
			barcode: b.barcode,
			createdAt: b.createdAt
		})
		.from(b)
		.orderBy(desc(b.createdAt))
		.all();
	return { beers };
};
