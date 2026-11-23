import { fail } from '@sveltejs/kit';
import { DEFAULT_PEOPLE } from '#lib/people.ts';
import { savePeople } from '#lib/server/people.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const people = DEFAULT_PEOPLE.map((d) => {
			const name = String(form.get(`name${d.key}`) ?? '').trim();
			const short = String(form.get(`short${d.key}`) ?? '').trim();
			return { key: d.key, name, short: short || name };
		});
		if (people.some((p) => !p.name)) return fail(400, { error: 'Les deux prénoms sont obligatoires.' });
		if (people.some((p) => p.name.length > 40 || p.short.length > 12))
			return fail(400, { error: 'Nom trop long (40 caractères max, 12 pour l’abrégé).' });
		savePeople(people);
		return { saved: true };
	}
};
