import { inArray } from 'drizzle-orm';
import { db, schema } from './db';
import { DEFAULT_PEOPLE, type Person } from '#lib/people.ts';

const keys = (k: Person['key']) => [`person${k}.name`, `person${k}.short`] as const;

/** Tasters' names from the settings table, falling back to the defaults. */
export function getPeople(): Person[] {
	const rows = db
		.select()
		.from(schema.settings)
		.where(inArray(schema.settings.key, DEFAULT_PEOPLE.flatMap((p) => keys(p.key))))
		.all();
	const get = (k: string) => rows.find((r) => r.key === k)?.value;
	return DEFAULT_PEOPLE.map((d) => {
		const [nameKey, shortKey] = keys(d.key);
		const name = get(nameKey) ?? d.name;
		return { key: d.key, name, short: get(shortKey) ?? (get(nameKey) ? name : d.short) };
	});
}

export function savePeople(people: Person[]) {
	db.transaction((tx) => {
		for (const p of people) {
			const [nameKey, shortKey] = keys(p.key);
			for (const [key, value] of [
				[nameKey, p.name],
				[shortKey, p.short]
			])
				tx.insert(schema.settings)
					.values({ key, value })
					.onConflictDoUpdate({ target: schema.settings.key, set: { value } })
					.run();
		}
	});
}
