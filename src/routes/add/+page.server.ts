import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { readForm, toFields } from '#lib/server/beer-form.ts';
import { photoFromForm } from '#lib/server/save.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const b = schema.beers;
	return {
		known: db.select({ id: b.id, name: b.name, barcode: b.barcode }).from(b).all()
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const values = readForm(form);
		const parsed = toFields(values);
		if ('error' in parsed) return fail(400, { values, error: parsed.error, existingId: null as number | null });

		if (parsed.fields.barcode) {
			const dup = db
				.select({ id: schema.beers.id })
				.from(schema.beers)
				.where(eq(schema.beers.barcode, parsed.fields.barcode))
				.get();
			if (dup) return fail(409, { values, error: 'Cette bière est déjà dans la liste.', existingId: dup.id });
		}

		const now = new Date();
		const photo = await photoFromForm(form, values.imageUrl);
		const row = db
			.insert(schema.beers)
			.values({
				...parsed.fields,
				photo,
				createdBy: locals.user.login,
				createdAt: now,
				updatedBy: locals.user.login,
				updatedAt: now
			})
			.returning({ id: schema.beers.id })
			.get();
		redirect(303, `/beer/${row.id}`);
	}
};
