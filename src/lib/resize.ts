/** Downscale an image client-side to keep uploads small (phone photos are 3-10 MB). */
export async function resizeImage(file: File, max = 1200, quality = 0.82): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
	const w = Math.round(bitmap.width * scale);
	const h = Math.round(bitmap.height * scale);
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
	bitmap.close();
	return new Promise((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('resize failed'))), 'image/jpeg', quality)
	);
}
