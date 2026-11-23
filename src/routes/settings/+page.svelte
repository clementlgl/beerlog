<script lang="ts">
	import { enhance } from '$app/forms';
	import Glass from '#lib/components/Glass.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Each taster gets their own glass: a pale one and a dark one.
	const GLASS_STYLE = { 1: 'Blonde', 2: 'Brune' } as const;

	// svelte-ignore state_referenced_locally
	let names = $state(Object.fromEntries(data.people.map((p) => [p.key, p.name])));
	const dirty = $derived(data.people.some((p) => names[p.key].trim() !== p.name));
	let submitting = $state(false);
</script>

<a href="/" class="mt-2 mb-4 inline-block text-sm text-soft">← Toutes les bières</a>

<h1 class="text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em]">Qui goûte ?</h1>
<p class="mt-1 text-soft">Vos prénoms s’affichent à côté de vos notes.</p>

<form
	method="POST"
	class="mt-8"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#each data.people as p (p.key)}
		<label class="flex items-end gap-4 py-3">
			<span aria-hidden="true"><Glass rating={8} style={GLASS_STYLE[p.key]} height={56} /></span>
			<span class="sr-only">Prénom {p.key}</span>
			<input
				class="name min-w-0 flex-1"
				name="name{p.key}"
				bind:value={names[p.key]}
				required
				maxlength="24"
				autocomplete="off"
				spellcheck="false"
			/>
		</label>
	{/each}

	<!-- The button only shows up once a name changes. -->
	<div class="mt-8 flex min-h-12 items-center gap-4">
		{#if dirty || submitting}
			<button class="btn-primary px-6" disabled={submitting}>
				{submitting ? 'Enregistrement…' : 'Enregistrer'}
			</button>
		{/if}
		{#if form?.error}
			<p class="font-medium text-danger" role="alert">{form.error}</p>
		{:else if form?.saved && !dirty}
			<p class="font-medium text-soft" role="status">Prénoms enregistrés</p>
		{/if}
	</div>
</form>

<style>
	/* The name is the field: no box, just a baseline that darkens while typing. */
	.name {
		padding: 0.25rem 0;
		border: 0;
		border-bottom: 2px solid var(--c-line);
		background: transparent;
		font-size: 28px;
		line-height: 1.15;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: var(--c-ink);
		outline: none;
		transition: border-color 0.15s;
	}
	.name:hover {
		border-color: var(--c-soft);
	}
	.name:focus {
		border-color: var(--c-ink);
	}
</style>
