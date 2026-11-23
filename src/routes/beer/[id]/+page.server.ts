import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { ratingDates, readForm, toFields } from '#lib/server/beer-form.ts';
import { photoFromForm } from '#lib/server/save.ts';
import { deletePhoto } from '#lib/server/photos.ts';
import type { Actions, PageServerLoad } from './$types';

function getBeer(idParam: string) {
	const id = Number(idParam);
	if (!Number.isInteger(id)) error(404, 'Bière introuvable');
	const beer = db.select().from(schema.beers).where(eq(schema.beers.id, id)).get();
	if (!beer) error(404, 'Bière introuvable');
	return beer;
}

export const load: PageServerLoad = ({ params }) => {
	const beer = getBeer(params.id);
	return { beer };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const beer = getBeer(params.id);
		const form = await request.formData();
		const values = readForm(form);
		const parsed = toFields(values);
		if ('error' in parsed) return fail(400, { values, error: parsed.error });

		if (parsed.fields.barcode) {
			const dup = db
				.select({ id: schema.beers.id })
				.from(schema.beers)
				.where(and(eq(schema.beers.barcode, parsed.fields.barcode), ne(schema.beers.id, beer.id)))
				.get();
			if (dup) return fail(409, { values, error: 'Ce code-barres appartient déjà à une autre bière.' });
		}

		let photo = beer.photo;
		const newPhoto = await photoFromForm(form, values.imageUrl);
		if (newPhoto || form.get('removePhoto')) {
			await deletePhoto(beer.photo);
			photo = newPhoto;
		}

		const now = new Date();
		db.update(schema.beers)
			.set({ ...parsed.fields, ...ratingDates(parsed.fields, now, beer), photo, updatedAt: now })
			.where(eq(schema.beers.id, beer.id))
			.run();
		redirect(303, `/beer/${beer.id}`);
	},

	delete: async ({ params }) => {
		const beer = getBeer(params.id);
		db.delete(schema.beers).where(eq(schema.beers.id, beer.id)).run();
		await deletePhoto(beer.photo);
		redirect(303, '/');
	}
};
