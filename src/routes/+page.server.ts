import { desc } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { averageRating } from '#lib/people.ts';
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
			rating1: b.rating1,
			rating2: b.rating2,
			barcode: b.barcode,
			createdAt: b.createdAt
		})
		.from(b)
		.orderBy(desc(b.createdAt))
		.all();
	return { beers: beers.map((x) => ({ ...x, rating: averageRating(x) })) };
};
