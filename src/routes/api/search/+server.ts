import { json } from '@sveltejs/kit';
import { searchBeers } from '#lib/server/off.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	if (q.length < 2) return json({ hits: [] });
	try {
		return json({ hits: await searchBeers(q) });
	} catch {
		return json({ hits: [], offline: true });
	}
};
