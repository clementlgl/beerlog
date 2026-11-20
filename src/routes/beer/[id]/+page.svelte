<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import BeerForm from '#lib/components/BeerForm.svelte';
	import Glass from '#lib/components/Glass.svelte';
	import { beerColor } from '#lib/styles.ts';
	import { fr } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let editing = $state(false);
	const beer = $derived(data.beer);
	const scanned = $derived(page.url.searchParams.has('scanned'));

	// Leave edit mode once the saved beer comes back from the server.
	let lastUpdate = $derived(data.beer.updatedAt.getTime());
	$effect.pre(() => {
		void lastUpdate;
		editing = false;
	});
	$effect(() => {
		if (form?.error) editing = true;
	});

	const fmt = (d: Date) =>
		new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
</script>

<a href="/" class="mt-2 mb-4 inline-block text-sm text-soft">← Toutes les bières</a>

{#if scanned && !editing}
	<p class="mb-4 rounded-xl bg-ink px-4 py-3 font-semibold text-paper">Déjà goûtée : elle est dans la liste.</p>
{/if}

{#if editing}
	<div class="mb-4 flex items-baseline justify-between">
		<h1 class="text-2xl font-extrabold tracking-[-0.01em]">Modifier la fiche</h1>
		<button class="text-sm text-soft underline" onclick={() => (editing = false)}>Annuler</button>
	</div>
	<BeerForm
		values={form?.values ?? beer}
		photoUrl={beer.photo ? `/photos/${beer.photo}` : null}
		action="?/update"
		submitLabel="Enregistrer les modifications"
		error={form?.error}
	/>
	<form
		method="POST"
		action="?/delete"
		class="mt-8 border-t border-line pt-4"
		use:enhance={({ cancel }) => {
			if (!confirm(`Supprimer « ${beer.name} » ? Cette action est définitive.`)) cancel();
		}}
	>
		<button class="w-full rounded-xl px-4 py-3 font-semibold text-danger">Supprimer cette bière</button>
	</form>
{:else}
	<article>
		<div class="flex items-end gap-5">
			<Glass rating={beer.rating} style={beer.style} height={112} />
			<div class="min-w-0 pb-1">
				{#if beer.rating}
					<p class="text-5xl leading-none font-extrabold tracking-[-0.03em]">
						{fr(beer.rating)}<span class="ml-1.5 text-xl font-semibold text-soft">sur 10</span>
					</p>
				{:else}
					<p class="text-lg font-semibold text-soft">Pas encore notée</p>
				{/if}
			</div>
		</div>

		<h1 class="mt-5 text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em]">{beer.name}</h1>
		{#if beer.brewery}<p class="mt-1 text-lg text-soft">{beer.brewery}</p>{/if}

		<dl class="mt-5 grid grid-cols-3 border-y border-line py-3">
			<div>
				<dt class="text-sm text-soft">Style</dt>
				<dd class="flex items-center gap-1.5 font-semibold">
					{#if beerColor(beer.style)}
						<span class="h-2.5 w-2.5 rounded-full ring-1 ring-soft/50" style="background:{beerColor(beer.style)}"></span>
					{/if}
					{beer.style ?? '—'}
				</dd>
			</div>
			<div>
				<dt class="text-sm text-soft">Degré</dt>
				<dd class="font-semibold">{beer.abv != null ? `${fr(beer.abv)} %` : '—'}</dd>
			</div>
			<div>
				<dt class="text-sm text-soft">Pays</dt>
				<dd class="truncate font-semibold">{beer.country ?? '—'}</dd>
			</div>
		</dl>

		{#if beer.comment}
			<p class="mt-5 text-lg leading-relaxed whitespace-pre-line">{beer.comment}</p>
		{/if}

		{#if beer.photo}
			<img src="/photos/{beer.photo}" alt={beer.name} class="mt-6 max-h-96 w-full rounded-2xl bg-field object-contain" />
		{/if}

		<p class="mt-5 text-sm text-soft">
			Ajoutée le {fmt(beer.createdAt)}.
			{#if beer.updatedAt.getTime() !== beer.createdAt.getTime()}
				Modifiée le {fmt(beer.updatedAt)}.
			{/if}
			{#if beer.barcode}<br />Code-barres {beer.barcode}{/if}
		</p>
	</article>
	<button class="btn-primary mt-6 w-full" onclick={() => (editing = true)}>Modifier ou noter</button>
{/if}
