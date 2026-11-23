import { inArray } from 'drizzle-orm';
import { db, schema } from './db';
import { DEFAULT_PEOPLE, type Person } from '#lib/people.ts';

const nameKey = (k: Person['key']) => `person${k}.name`;

/** Tasters' names from the settings table, falling back to the defaults. */
export function getPeople(): Person[] {
	const rows = db
		.select()
		.from(schema.settings)
		.where(inArray(schema.settings.key, DEFAULT_PEOPLE.map((p) => nameKey(p.key))))
		.all();
	return DEFAULT_PEOPLE.map((d) => ({
		key: d.key,
		name: rows.find((r) => r.key === nameKey(d.key))?.value ?? d.name
	}));
}

export function savePeople(people: Person[]) {
	db.transaction((tx) => {
		for (const p of people) {
			const key = nameKey(p.key);
			tx.insert(schema.settings)
				.values({ key, value: p.name })
				.onConflictDoUpdate({ target: schema.settings.key, set: { value: p.name } })
				.run();
		}
	});
}
