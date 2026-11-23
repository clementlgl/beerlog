import { db, schema } from '#lib/server/db/index.ts';
import { STYLES, findStyle } from '#lib/styles.ts';
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
			rating1: b.rating1,
			rating2: b.rating2
		})
		.from(b)
		.all()
		.map((x) => ({ ...x, rating: averageRating(x) }));

	// One entry per style (pale → dark) plus "no style", keeping only those with beers.
	const groups = [...STYLES.map((s) => s.name), null].map((name) => {
		const inGroup = beers.filter((x) => (findStyle(x.style)?.name ?? null) === name);
		const rated = inGroup.filter((x) => x.rating != null);
		return {
			name: name ?? 'Sans style',
			color: name ? findStyle(name)!.color : null,
			count: inGroup.length,
			average: rated.length ? rated.reduce((sum, x) => sum + x.rating!, 0) / rated.length : null
		};
	});

	const top = beers
		.filter((x) => x.rating != null)
		.sort((a, z) => z.rating! - a.rating! || a.name.localeCompare(z.name, 'fr'))
		.slice(0, 5);

	return { total: beers.length, styles: groups.filter((g) => g.count > 0), top };
};
