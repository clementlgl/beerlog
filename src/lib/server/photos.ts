import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { PHOTO_DIR } from './config';

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp'
};

async function write(buf: Buffer, type: string): Promise<string | null> {
	const ext = EXT[type];
	if (!ext || buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
	const name = `${crypto.randomUUID()}.${ext}`;
	await fs.writeFile(path.join(PHOTO_DIR, name), buf);
	return name;
}

/** Save an uploaded file (already resized client-side). */
export async function savePhotoFile(file: File | null): Promise<string | null> {
	if (!file || file.size === 0) return null;
	return write(Buffer.from(await file.arrayBuffer()), file.type);
}

/** Download a remote image (Open Food Facts) so the app does not depend on it later. */
export async function savePhotoFromUrl(url: string | null): Promise<string | null> {
	if (!url || !/^https:\/\/images\.openfoodfacts\.org\//.test(url)) return null;
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
		if (!res.ok) return null;
		const type = (res.headers.get('content-type') ?? '').split(';')[0];
		return write(Buffer.from(await res.arrayBuffer()), type);
	} catch {
		return null;
	}
}

export async function deletePhoto(name: string | null) {
	if (!name) return;
	await fs.rm(path.join(PHOTO_DIR, path.basename(name)), { force: true });
}

export function photoPath(name: string) {
	return path.join(PHOTO_DIR, path.basename(name));
}
