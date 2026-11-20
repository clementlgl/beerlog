import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db, schema } from '#lib/server/db/index.ts';
import { lookupBarcode } from '#lib/server/off.ts';
import type { RequestHandler } from './$types';

/** Barcode lookup: first our own list ("déjà goûtée ?"), then Open Food Facts. */
export const GET: RequestHandler = async ({ url }) => {
	const code = (url.searchParams.get('barcode') ?? '').trim();
	if (!code) return json({ error: 'barcode manquant' }, { status: 400 });

	const existing = db.select().from(schema.beers).where(eq(schema.beers.barcode, code)).get();
	if (existing) return json({ existing });

	try {
		const info = await lookupBarcode(code);
		return json({ info });
	} catch {
		return json({ info: null, offline: true });
	}
};
