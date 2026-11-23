import { fail } from '@sveltejs/kit';
import { DEFAULT_PEOPLE } from '#lib/people.ts';
import { savePeople } from '#lib/server/people.ts';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const people = DEFAULT_PEOPLE.map((d) => ({
			key: d.key,
			name: String(form.get(`name${d.key}`) ?? '').trim()
		}));
		if (people.some((p) => !p.name)) return fail(400, { error: 'Indiquez les deux prénoms.' });
		if (people.some((p) => p.name.length > 24))
			return fail(400, { error: 'Un prénom fait 24 caractères au plus.' });
		savePeople(people);
		return { saved: true };
	}
};
