import { norm } from './normalize.ts';

/**
 * Colour families along the beer colour scale (EBC/SRM), pale to black.
 * Used both to tint the glass and as the colour filter on the list.
 */
export const FAMILIES = [
	{ id: 'pale', label: 'Pâle', color: '#f6e39a' },
	{ id: 'blonde', label: 'Blonde', color: '#ecc25a' },
	{ id: 'amber', label: 'Ambrée', color: '#d98a2f' },
	{ id: 'brown', label: 'Brune', color: '#7a3b16' },
	{ id: 'black', label: 'Noire', color: '#1c0d05' }
] as const;

export type FamilyId = (typeof FAMILIES)[number]['id'];

// Keyword (normalised) → family, and optional colour override. First match wins.
const RULES: [string, FamilyId, string?][] = [
	['imperial stout', 'black'],
	['stout', 'black'],
	['noire', 'black'],
	['porter', 'brown'],
	['brune', 'brown'],
	['ipa', 'amber', '#e0a03c'],
	['pale ale', 'blonde', '#e8b546'],
	['double', 'brown'],
	['dubbel', 'brown'],
	['kriek', 'amber', '#9e2a3a'],
	['framboise', 'amber', '#b53a55'],
	['fruit', 'amber', '#c0485a'],
	['ambree', 'amber'],
	['amber', 'amber'],
	['rousse', 'amber'],
	['red', 'amber', '#a8401f'],
	['ale', 'amber', '#e0a03c'],
	['blanche', 'pale'],
	['wheat', 'pale'],
	['weiss', 'pale'],
	['pils', 'pale'],
	['lager', 'pale'],
	['gueuze', 'pale'],
	['lambic', 'pale'],
	['sans alcool', 'pale'],
	['triple', 'blonde'],
	['tripel', 'blonde'],
	['blonde', 'blonde'],
	['saison', 'blonde'],
	['abbaye', 'blonde'],
	['trappiste', 'blonde'],
	['sour', 'blonde']
];

export function beerFamily(style: string | null | undefined): FamilyId | null {
	const s = norm(style);
	if (!s) return null;
	for (const [kw, fam] of RULES) if (s.includes(kw)) return fam;
	return null;
}

/** Liquid colour for the glass; null when the style is unknown. */
export function beerColor(style: string | null | undefined): string | null {
	const s = norm(style);
	if (!s) return null;
	for (const [kw, fam, override] of RULES) {
		if (s.includes(kw)) return override ?? FAMILIES.find((f) => f.id === fam)!.color;
	}
	return null;
}
