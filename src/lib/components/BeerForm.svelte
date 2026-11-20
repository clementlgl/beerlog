<script module lang="ts">
	export type FormValues = {
		barcode?: string | null;
		name?: string | null;
		brewery?: string | null;
		style?: string | null;
		abv?: number | string | null;
		country?: string | null;
		rating?: number | string | null;
		comment?: string | null;
		imageUrl?: string | null;
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import RatingInput from './RatingInput.svelte';
	import Glass from './Glass.svelte';
	import { resizeImage } from '#lib/resize.ts';


	type Props = {
		values: FormValues;
		/** Current local photo URL (edit mode) */
		photoUrl?: string | null;
		action?: string;
		submitLabel: string;
		error?: string | null;
		styles?: string[];
	};
	let { values, photoUrl = null, action = '', submitLabel, error = null, styles = [] }: Props =
		$props();

	// Form state is seeded from props; the parent remounts the form (via {#key}) to reset it.
	// svelte-ignore state_referenced_locally
	let v = $state({ ...values });
	// svelte-ignore state_referenced_locally
	let rating = $state<number | null>(values.rating ? Number(values.rating) : null);
	let photoBlob = $state<Blob | null>(null);
	let photoPreview = $state<string | null>(null);
	let removePhoto = $state(false);
	let submitting = $state(false);

	const shownImage = $derived(
		photoPreview ?? (removePhoto ? null : (photoUrl ?? v.imageUrl ?? null))
	);

	const STYLE_SUGGESTIONS = [
		'Blonde', 'Blanche', 'Ambrée', 'Brune', 'IPA', 'NEIPA', 'Double IPA', 'Pale Ale', 'Lager',
		'Pils', 'Stout', 'Imperial Stout', 'Porter', 'Triple', 'Abbaye', 'Trappiste', 'Saison',
		'Sour', 'Gueuze', 'Kriek', 'Fruitée', 'Sans alcool'
	];
	const allStyles = $derived([...new Set([...STYLE_SUGGESTIONS, ...styles])].sort());

	async function onPhoto(e: Event) {
		const file = (e.currentTarget as HTMLInputElement).files?.[0];
		if (!file) return;
		photoBlob = await resizeImage(file);
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		photoPreview = URL.createObjectURL(photoBlob);
		removePhoto = false;
	}
</script>

<form
	method="POST"
	{action}
	enctype="multipart/form-data"
	class="space-y-4"
	use:enhance={({ formData }) => {
		submitting = true;
		formData.delete('photoFile');
		if (photoBlob) formData.set('photo', photoBlob, 'photo.jpg');
		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<input type="hidden" name="imageUrl" value={removePhoto || photoBlob ? '' : (v.imageUrl ?? '')} />
	<input type="hidden" name="rating" value={rating ?? ''} />
	<input type="hidden" name="removePhoto" value={removePhoto ? '1' : ''} />

	<div class="flex items-start gap-4">
		<label
			class="relative flex h-32 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-field text-center text-sm text-soft"
		>
			{#if shownImage}
				<img src={shownImage} alt="" class="h-full w-full object-cover" />
			{:else}
				<span>Ajouter une photo</span>
			{/if}
			<input
				type="file"
				name="photoFile"
				accept="image/*"
				capture="environment"
				class="sr-only"
				onchange={onPhoto}
			/>
		</label>
		<div class="flex-1 space-y-3">
			<label class="block">
				<span class="label">Nom *</span>
				<input class="input" name="name" required bind:value={v.name} autocomplete="off" />
			</label>
			<label class="block">
				<span class="label">Brasserie / marque</span>
				<input class="input" name="brewery" bind:value={v.brewery} autocomplete="off" />
			</label>
		</div>
	</div>
	{#if shownImage}
		<button
			type="button"
			class="text-sm text-soft underline"
			onclick={() => {
				removePhoto = true;
				photoBlob = null;
				photoPreview = null;
			}}>Retirer la photo</button
		>
	{/if}

	<div class="grid grid-cols-2 gap-3">
		<label class="block">
			<span class="label">Style</span>
			<input class="input" name="style" list="styles" bind:value={v.style} autocomplete="off" />
			<datalist id="styles">
				{#each allStyles as s (s)}<option value={s}></option>{/each}
			</datalist>
		</label>
		<label class="block">
			<span class="label">Degré (% vol)</span>
			<input class="input" name="abv" inputmode="decimal" bind:value={v.abv} autocomplete="off" />
		</label>
		<label class="block">
			<span class="label">Pays</span>
			<input class="input" name="country" bind:value={v.country} autocomplete="off" />
		</label>
		<label class="block">
			<span class="label">Code-barres</span>
			<input class="input" name="barcode" inputmode="numeric" bind:value={v.barcode} autocomplete="off" />
		</label>
	</div>

	<div>
		<div class="mb-2 flex items-end gap-3">
			<Glass {rating} style={v.style ?? null} height={64} />
			<div class="pb-1">
				<span class="label mb-0">Note</span>
				<span class="text-2xl leading-none font-extrabold">
					{#if rating}{rating}<span class="ml-1 text-base font-semibold text-soft">sur 10</span>{:else}<span class="text-base font-semibold text-soft">Non notée</span>{/if}
				</span>
			</div>
		</div>
		<RatingInput value={rating} onchange={(r) => (rating = r)} />
	</div>

	<label class="block">
		<span class="label">Commentaire</span>
		<textarea class="input min-h-24" name="comment" bind:value={v.comment}></textarea>
	</label>

	{#if error}
		<p class="rounded-xl bg-field p-3 font-medium text-danger">{error}</p>
	{/if}

	<button class="btn-primary w-full" disabled={submitting}>
		{submitting ? 'Enregistrement…' : submitLabel}
	</button>
</form>
