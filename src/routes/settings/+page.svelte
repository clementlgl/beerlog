<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let submitting = $state(false);
</script>

<a href="/" class="mt-2 mb-4 inline-block text-sm text-soft">← Toutes les bières</a>

<h1 class="text-2xl font-extrabold tracking-[-0.01em]">Réglages</h1>
<p class="mt-1 text-soft">Les deux personnes qui notent les bières.</p>

<form
	method="POST"
	class="mt-6 space-y-6"
	use:enhance={() => {
		submitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	{#each data.people as p (p.key)}
		<fieldset class="grid grid-cols-[1fr_8rem] gap-3">
			<legend class="mb-2 font-semibold">Personne {p.key}</legend>
			<label class="block">
				<span class="label">Prénom</span>
				<input class="input" name="name{p.key}" value={p.name} required maxlength="40" autocomplete="off" />
			</label>
			<label class="block">
				<span class="label">Abrégé</span>
				<input class="input" name="short{p.key}" value={p.short} maxlength="12" autocomplete="off" />
			</label>
		</fieldset>
	{/each}
	<p class="text-sm text-soft">L’abrégé s’affiche dans la liste (ex. « Séb 7 · Clem 9 »). Vide = prénom.</p>

	{#if form?.error}
		<p class="rounded-xl bg-field p-3 font-medium text-danger">{form.error}</p>
	{:else if form?.saved}
		<p class="rounded-xl bg-field p-3 font-medium">Noms enregistrés.</p>
	{/if}

	<button class="btn-primary w-full" disabled={submitting}>
		{submitting ? 'Enregistrement…' : 'Enregistrer'}
	</button>
</form>
