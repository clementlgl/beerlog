import { norm } from './normalize.ts';

/** Colour families along the beer colour scale (EBC/SRM), pale to black. Used by the list filter. */
export const FAMILIES = [
	{ id: 'pale', label: 'Pâle', color: '#f6e39a' },
	{ id: 'blonde', label: 'Blonde', color: '#ecc25a' },
	{ id: 'amber', label: 'Ambrée', color: '#d98a2f' },
	{ id: 'brown', label: 'Brune', color: '#7a3b16' },
	{ id: 'black', label: 'Noire', color: '#1c0d05' }
] as const;

export type FamilyId = (typeof FAMILIES)[number]['id'];

/** The only styles a beer can have, ordered pale to dark. */
export const STYLES = [
	{ name: 'Blanche', family: 'pale', color: '#f6e39a' },
	{ name: 'Lager', family: 'pale', color: '#f2d779' },
	{ name: 'Blonde', family: 'blonde', color: '#ecc25a' },
	{ name: 'Triple', family: 'blonde', color: '#e3ab3f' },
	{ name: 'IPA', family: 'amber', color: '#e0a03c' },
	{ name: 'Ambrée', family: 'amber', color: '#d98a2f' },
	{ name: 'Rousse', family: 'amber', color: '#b5532a' },
	{ name: 'Fruitée', family: 'amber', color: '#a8324a' },
	{ name: 'Brune', family: 'brown', color: '#7a3b16' },
	{ name: 'Stout', family: 'black', color: '#1c0d05' }
] as const satisfies readonly { name: string; family: FamilyId; color: string }[];

export type StyleName = (typeof STYLES)[number]['name'];

const byName = new Map<string, (typeof STYLES)[number]>(STYLES.map((s) => [norm(s.name), s]));

export const findStyle = (style: string | null | undefined) => byName.get(norm(style)) ?? null;
export const isStyle = (style: string): style is StyleName => byName.has(norm(style));
export const beerFamily = (style: string | null | undefined): FamilyId | null =>
	findStyle(style)?.family ?? null;
/** Liquid colour for the glass; null when the beer has no style. */
export const beerColor = (style: string | null | undefined): string | null =>
	findStyle(style)?.color ?? null;
