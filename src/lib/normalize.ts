/** Lowercase, strip accents and punctuation for forgiving search. */
export function norm(s: string | null | undefined): string {
	return (s ?? '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}
