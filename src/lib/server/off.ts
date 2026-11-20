/** Open Food Facts client (server side: sets User-Agent, avoids CORS). */
const UA = 'BeerLog/0.1 (self-hosted beer journal)';
const PRODUCT_FIELDS =
	'code,product_name,product_name_fr,brands,categories_tags,countries_tags,origins,image_front_url,nutriments';

export type BeerInfo = {
	barcode: string;
	name: string;
	brewery: string | null;
	style: string | null;
	abv: number | null;
	country: string | null;
	imageUrl: string | null;
};

// Most specific first.
const STYLES: [string, string][] = [
	['en:non-alcoholic-beers', 'Sans alcool'],
	['en:trappist-beers', 'Trappiste'],
	['en:abbey-beers', 'Abbaye'],
	['en:abbey-ales', 'Abbaye'],
	['en:double-ipa', 'Double IPA'],
	['en:neipa', 'NEIPA'],
	['en:ipa', 'IPA'],
	['ca:cervesa-ipa', 'IPA'],
	['en:india-pale-ales', 'IPA'],
	['en:imperial-stouts', 'Imperial Stout'],
	['en:stouts', 'Stout'],
	['en:porters', 'Porter'],
	['en:sour-beers', 'Sour'],
	['en:gueuze', 'Gueuze'],
	['en:lambics', 'Lambic'],
	['en:kriek', 'Kriek'],
	['en:saisons', 'Saison'],
	['en:tripel-beers', 'Triple'],
	['en:triple-beers', 'Triple'],
	['en:dubbel-beers', 'Double'],
	['en:pilsners', 'Pils'],
	['en:pils', 'Pils'],
	['en:white-beers', 'Blanche'],
	['en:wheat-beers', 'Blanche'],
	['en:beers-with-fruits', 'Fruitée'],
	['en:fruit-beers', 'Fruitée'],
	['en:amber-beers', 'Ambrée'],
	['en:dark-beers', 'Brune'],
	['en:brown-beers', 'Brune'],
	['en:blond-beers', 'Blonde'],
	['en:pale-ales', 'Pale Ale'],
	['en:ales', 'Ale'],
	['en:lagers', 'Lager']
];

const COUNTRY_BEERS: Record<string, string> = {
	'en:belgian-beers': 'Belgique',
	'en:french-beers': 'France',
	'en:german-beers': 'Allemagne',
	'en:british-beers': 'Royaume-Uni',
	'en:irish-beers': 'Irlande',
	'en:dutch-beers': 'Pays-Bas',
	'en:czech-beers': 'Tchéquie',
	'en:american-beers': 'États-Unis',
	'en:mexican-beers': 'Mexique',
	'en:italian-beers': 'Italie',
	'en:spanish-beers': 'Espagne',
	'en:japanese-beers': 'Japon',
	'en:scottish-beers': 'Écosse',
	'en:danish-beers': 'Danemark'
};

function pickStyle(tags: string[] = []): string | null {
	for (const [tag, label] of STYLES) if (tags.includes(tag)) return label;
	return null;
}

function pickCountry(tags: string[] = [], origins?: string): string | null {
	for (const t of tags) if (COUNTRY_BEERS[t]) return COUNTRY_BEERS[t];
	return origins?.trim() || null;
}

function firstBrand(brands: unknown): string | null {
	if (Array.isArray(brands)) return brands[0] ?? null;
	if (typeof brands === 'string') return brands.split(',')[0].trim() || null;
	return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toInfo(p: any): BeerInfo {
	const abv = p.nutriments?.alcohol_100g ?? p.nutriments?.alcohol;
	return {
		barcode: String(p.code),
		name: p.product_name_fr || p.product_name || '',
		brewery: firstBrand(p.brands),
		style: pickStyle(p.categories_tags),
		abv: typeof abv === 'number' ? abv : null,
		country: pickCountry(p.categories_tags, p.origins),
		imageUrl: p.image_front_url ?? p.image_front_small_url ?? null
	};
}

export async function lookupBarcode(code: string): Promise<BeerInfo | null> {
	if (!/^\d{6,14}$/.test(code)) return null;
	const res = await fetch(
		`https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=${PRODUCT_FIELDS}`,
		{ headers: { 'user-agent': UA }, signal: AbortSignal.timeout(10_000) }
	);
	if (!res.ok) return null;
	const data = await res.json();
	if (data.status !== 1 || !data.product) return null;
	return toInfo(data.product);
}

export type SearchHit = {
	barcode: string;
	name: string;
	brewery: string | null;
	style: string | null;
	thumb: string | null;
};

export async function searchBeers(q: string): Promise<SearchHit[]> {
	const query = `${q} categories_tags:"en:beers"`;
	const url = new URL('https://search.openfoodfacts.org/search');
	url.searchParams.set('q', query);
	url.searchParams.set('page_size', '15');
	url.searchParams.set(
		'fields',
		'code,product_name,product_name_fr,brands,categories_tags,image_front_small_url'
	);
	const res = await fetch(url, {
		headers: { 'user-agent': UA },
		signal: AbortSignal.timeout(10_000)
	});
	if (!res.ok) return [];
	const data = await res.json();
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return (data.hits ?? []).map((h: any) => ({
		barcode: String(h.code),
		name: h.product_name_fr || h.product_name || '(sans nom)',
		brewery: firstBrand(h.brands),
		style: pickStyle(h.categories_tags),
		thumb: h.image_front_small_url ?? null
	}));
}
