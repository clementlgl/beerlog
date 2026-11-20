import { error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import { photoPath } from '#lib/server/photos.ts';
import type { RequestHandler } from './$types';

const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export const GET: RequestHandler = async ({ params }) => {
	const ext = params.file.split('.').pop() ?? '';
	if (!TYPES[ext]) error(404);
	try {
		const data = await fs.readFile(photoPath(params.file));
		return new Response(data, {
			headers: {
				'content-type': TYPES[ext],
				'cache-control': 'private, max-age=31536000, immutable'
			}
		});
	} catch {
		error(404);
	}
};
