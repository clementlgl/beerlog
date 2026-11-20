<script lang="ts">
	import { goto } from '$app/navigation';
	import Glass from '#lib/components/Glass.svelte';
	import Scanner from '#lib/components/Scanner.svelte';
	import { norm } from '#lib/normalize.ts';
	import { FAMILIES, beerFamily, type FamilyId } from '#lib/beer-color.ts';
	import { fr } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let q = $state('');
	let sort = $state<'recent' | 'rating' | 'name'>('recent');
	let family = $state<FamilyId | null>(null);
	let scanning = $state(false);

	const indexed = $derived(
		data.beers.map((b) => ({
			...b,
			family: beerFamily(b.style),
			hay: norm([b.name, b.brewery, b.style, b.country, b.barcode].join(' '))
		}))
	);

	const filtered = $derived.by(() => {
		const terms = norm(q).split(' ').filter(Boolean);
		const list = indexed.filter(
			(b) => terms.every((t) => b.hay.includes(t)) && (!family || b.family === family)
		);
		if (sort === 'rating') list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
		else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
		return list;
	});

	const familyLabel = $derived(FAMILIES.find((f) => f.id === family)?.label);

	function onScan(code: string) {
		scanning = false;
		const hit = data.beers.find((b) => b.barcode === code);
		if (hit) goto(`/beer/${hit.id}?scanned=1`);
		else goto(`/add?barcode=${encodeURIComponent(code)}`);
	}
</script>

{#if scanning}
	<Scanner ondetect={onScan} onclose={() => (scanning = false)} />
{/if}

<div class="sticky top-0 z-20 -mx-5 bg-paper px-5 pt-3 pb-3">
	<div class="flex gap-0.5" role="group" aria-label="Filtrer par couleur">
		{#each FAMILIES as f, i (f.id)}
			<button
				class="group flex-1 pt-1 text-[11.5px] text-soft"
				aria-pressed={family === f.id}
				onclick={() => (family = family === f.id ? null : f.id)}
			>
				<span
					class="block h-3 transition-[opacity,transform] {i === 0 ? 'rounded-l-full' : ''} {i ===
					FAMILIES.length - 1
						? 'rounded-r-full'
						: ''}"
					class:opacity-25={family && family !== f.id}
					class:scale-y-150={family === f.id}
					style="background:{f.color}"
				></span>
				<span class="mt-1.5 block" class:font-semibold={family === f.id} class:text-ink={family === f.id}
					>{f.label}</span
				>
			</button>
		{/each}
	</div>

	<div class="mt-3 flex gap-2">
		<input
			class="input"
			type="search"
			placeholder="Déjà goûtée ? Cherchez une bière"
			bind:value={q}
			autocomplete="off"
		/>
		<button
			class="btn-secondary shrink-0 px-3.5 py-2"
			onclick={() => (scanning = true)}
			aria-label="Scanner un code-barres"
		>
			<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
				<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 8v8M10 8v8M13 8v8M16.5 8v8" />
			</svg>
		</button>
	</div>

	<div class="mt-2 flex items-center justify-between text-sm text-soft">
		<span>
			{filtered.length}
			{filtered.length > 1 ? 'bières' : 'bière'}{#if familyLabel}&nbsp;de couleur {familyLabel.toLowerCase()}{/if}
		</span>
		<select class="bg-transparent font-medium text-ink outline-none" bind:value={sort} aria-label="Trier">
			<option value="recent">Plus récentes</option>
			<option value="rating">Mieux notées</option>
			<option value="name">De A à Z</option>
		</select>
	</div>
</div>

{#if data.beers.length === 0}
	<div class="mt-10 flex flex-col items-center text-center">
		<Glass rating={null} style={null} height={88} />
		<p class="mt-4 text-lg font-semibold">Aucune bière pour l’instant</p>
		<p class="text-soft">Scannez ou ajoutez la première que vous goûtez.</p>
		<a href="/add" class="btn-primary mt-5">Ajouter une bière</a>
	</div>
{:else if filtered.length === 0}
	<div class="mt-8 text-center">
		<p class="text-lg font-semibold">Pas encore goûtée</p>
		{#if q}
			<p class="text-soft">Aucune bière ne correspond à « {q} ».</p>
			<a href="/add?name={encodeURIComponent(q)}" class="btn-primary mt-5 inline-block">Ajouter « {q} »</a>
		{:else}
			<p class="text-soft">Aucune bière de cette couleur dans la liste.</p>
		{/if}
	</div>
{:else}
	<ul>
		{#each filtered as b (b.id)}
			<li class="border-b border-line">
				<a href="/beer/{b.id}" class="flex items-center gap-3.5 py-3 active:opacity-70">
					<Glass rating={b.rating} style={b.style} />
					<div class="min-w-0 flex-1">
						<p class="truncate text-[17px] leading-tight font-semibold">{b.name}</p>
						<p class="truncate text-[13px] text-soft">
							{[b.brewery, b.style, b.abv != null ? `${fr(b.abv)} %` : null].filter(Boolean).join(', ')}
						</p>
					</div>
					{#if b.rating}
						<div class="text-right">
							<span class="block text-[22px] leading-none font-extrabold">{fr(b.rating)}</span>
							<span class="text-[11px] text-soft">sur 10</span>
						</div>
					{:else}
						<span class="text-[13px] font-semibold text-soft">à noter</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}
