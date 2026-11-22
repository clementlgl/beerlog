<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import BeerForm, { type FormValues } from '#lib/components/BeerForm.svelte';
	import Scanner from '#lib/components/Scanner.svelte';
	import { norm } from '#lib/normalize.ts';
	import type { PageProps } from './$types';

	type Hit = { barcode: string; name: string; brewery: string | null; style: string | null; thumb: string | null };

	let { data, form }: PageProps = $props();

	let scanning = $state(false);
	let loading = $state(false);
	let message = $state<string | null>(null);
	let existing = $state<{ id: number; name: string } | null>(null);
	let values = $state<FormValues>({});
	let formKey = $state(0);

	let q = $state('');
	let hits = $state<Hit[]>([]);
	let searching = $state(false);
	let searchTimer: ReturnType<typeof setTimeout>;

	const knownByBarcode = $derived(
		new Map(data.known.filter((k) => k.barcode).map((k) => [k.barcode!, k]))
	);
	const localMatches = $derived.by(() => {
		const terms = norm(q).split(' ').filter(Boolean);
		if (!terms.length) return [];
		return data.known.filter((k) => terms.every((t) => norm(k.name).includes(t))).slice(0, 5);
	});

	function setValues(v: FormValues) {
		values = v;
		formKey++;
	}

	async function lookup(code: string) {
		code = code.trim();
		if (!code) return;
		loading = true;
		message = null;
		existing = null;
		try {
			const res = await fetch(`/api/lookup?barcode=${encodeURIComponent(code)}`);
			const body = await res.json();
			if (body.existing) {
				existing = body.existing;
			} else if (body.info) {
				setValues({ ...body.info });
				message = 'Infos récupérées sur Open Food Facts. Vérifiez-les avant d’enregistrer.';
			} else {
				setValues({ barcode: code });
				message = body.offline
					? 'Open Food Facts injoignable : saisie manuelle.'
					: 'Bière inconnue d’Open Food Facts : complétez à la main.';
			}
			hits = [];
		} finally {
			loading = false;
		}
	}

	function onSearchInput() {
		clearTimeout(searchTimer);
		if (q.trim().length < 2) {
			hits = [];
			return;
		}
		searchTimer = setTimeout(async () => {
			searching = true;
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
				hits = (await res.json()).hits;
			} finally {
				searching = false;
			}
		}, 400);
	}

	onMount(() => {
		const bc = page.url.searchParams.get('barcode');
		const name = page.url.searchParams.get('name');
		if (bc) lookup(bc);
		else if (name) {
			q = name;
			setValues({ name });
			onSearchInput();
		}
	});

	// After a failed submit, keep what the user typed.
	$effect(() => {
		if (form?.values) setValues(form.values);
	});
</script>

{#if scanning}
	<Scanner
		ondetect={(c) => {
			scanning = false;
			lookup(c);
		}}
		onclose={() => (scanning = false)}
	/>
{/if}

<h1 class="mt-2 mb-4 text-[28px] leading-tight font-extrabold tracking-[-0.02em]">Nouvelle dégustation</h1>

<section class="space-y-3">
	<button class="btn-primary flex w-full items-center justify-center gap-2" onclick={() => (scanning = true)}>
		<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
			<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 8v8M10 8v8M13 8v8M16.5 8v8" />
		</svg>
		Scanner le code-barres
	</button>
	<div class="relative">
		<input
			class="input"
			type="search"
			placeholder="Ou cherchez par nom sur Open Food Facts"
			bind:value={q}
			oninput={onSearchInput}
			autocomplete="off"
		/>
		{#if searching}<span class="absolute top-3 right-3.5 text-sm text-soft">Recherche…</span>{/if}
	</div>

	{#if localMatches.length}
		<div class="rounded-xl bg-field p-3">
			<p class="font-semibold">Déjà dans la liste</p>
			<ul class="mt-1 space-y-1">
				{#each localMatches as m (m.id)}
					<li><a class="underline" href="/beer/{m.id}">{m.name}</a></li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if hits.length}
		<ul class="max-h-80 overflow-y-auto border-y border-line">
			{#each hits as h (h.barcode)}
				{@const known = knownByBarcode.get(h.barcode)}
				<li class="border-b border-line last:border-b-0">
					<button
						class="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
						onclick={() => lookup(h.barcode)}
					>
						<div class="h-12 w-9 shrink-0 overflow-hidden rounded-md bg-field">
							{#if h.thumb}<img src={h.thumb} alt="" loading="lazy" class="h-full w-full object-cover" />{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate font-semibold">{h.name}</p>
							<p class="truncate text-sm text-soft">{[h.brewery, h.style].filter(Boolean).join(', ')}</p>
						</div>
						{#if known}<span class="shrink-0 rounded-md bg-ink px-2 py-0.5 text-xs font-semibold text-paper">Goûtée</span>{/if}
					</button>
				</li>
			{/each}
		</ul>
	{/if}

	{#if loading}<p class="text-soft">Recherche du code-barres…</p>{/if}
	{#if message}<p class="text-soft">{message}</p>{/if}
</section>

{#if existing}
	<div class="mt-6 rounded-2xl bg-ink p-5 text-paper">
		<p class="text-lg font-extrabold">Déjà goûtée</p>
		<p class="opacity-80">{existing.name} est déjà dans la liste.</p>
		<a href="/beer/{existing.id}" class="mt-4 inline-block rounded-xl bg-paper px-4 py-2.5 font-semibold text-ink">Voir la fiche</a>
	</div>
{/if}

{#if form?.existingId}
	<p class="mt-4">
		<a class="underline" href="/beer/{form.existingId}">Voir la bière déjà enregistrée</a>
	</p>
{/if}

{#if !existing}
	<section class="mt-8 border-t border-line pt-6">
		{#key formKey}
			<BeerForm {values} submitLabel="Enregistrer la bière" error={form?.error} />
		{/key}
	</section>
{/if}
