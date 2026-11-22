<script module lang="ts">
	export type FormValues = {
		barcode?: string | null;
		name?: string | null;
		brewery?: string | null;
		style?: string | null;
		abv?: number | string | null;
		country?: string | null;
		ratingSeb?: number | string | null;
		ratingClem?: number | string | null;
		commentSeb?: string | null;
		commentClem?: string | null;
		imageUrl?: string | null;
	};
</script>

<script lang="ts">
	import { enhance } from '$app/forms';
	import RatingInput from './RatingInput.svelte';
	import Glass from './Glass.svelte';
	import { STYLES } from '#lib/styles.ts';
	import { resizeImage } from '#lib/resize.ts';
	import { PEOPLE, averageRating, type PersonKey } from '#lib/people.ts';
	import { fr } from '#lib/format.ts';


	type Props = {
		values: FormValues;
		/** Current local photo URL (edit mode) */
		photoUrl?: string | null;
		action?: string;
		submitLabel: string;
		error?: string | null;
	};
	let { values, photoUrl = null, action = '', submitLabel, error = null }: Props = $props();

	// Form state is seeded from props; the parent remounts the form (via {#key}) to reset it.
	// svelte-ignore state_referenced_locally
	let v = $state({ ...values });
	const num = (x: number | string | null | undefined) => (x ? Number(x) : null);
	// svelte-ignore state_referenced_locally
	let ratings = $state<Record<PersonKey, number | null>>({
		Seb: num(values.ratingSeb),
		Clem: num(values.ratingClem)
	});
	const average = $derived(averageRating({ ratingSeb: ratings.Seb, ratingClem: ratings.Clem }));
	let photoBlob = $state<Blob | null>(null);
	let photoPreview = $state<string | null>(null);
	let removePhoto = $state(false);
	let submitting = $state(false);

	const shownImage = $derived(
		photoPreview ?? (removePhoto ? null : (photoUrl ?? v.imageUrl ?? null))
	);

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
	{#each PEOPLE as p (p.key)}
		<input type="hidden" name="rating{p.key}" value={ratings[p.key] ?? ''} />
	{/each}
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

	<fieldset>
		<legend class="label">Style</legend>
		<input type="hidden" name="style" value={v.style ?? ''} />
		<div class="flex flex-wrap gap-2">
			{#each STYLES as s (s.name)}
				{@const selected = v.style === s.name}
				<button
					type="button"
					aria-pressed={selected}
					class="flex items-center gap-2 rounded-full py-1.5 pr-3.5 pl-2.5 text-[15px] font-medium {selected
						? 'bg-ink text-paper'
						: 'bg-field text-ink'}"
					onclick={() => (v.style = selected ? null : s.name)}
				>
					<span class="h-3.5 w-3.5 rounded-full ring-1 ring-black/15" style="background:{s.color}"></span>
					{s.name}
				</button>
			{/each}
		</div>
	</fieldset>

	<div class="grid grid-cols-2 gap-3">
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

	<div class="flex items-end gap-3">
		<Glass rating={average} style={v.style ?? null} height={64} />
		<div class="pb-1">
			<span class="label mb-0">Moyenne</span>
			<span class="text-2xl leading-none font-extrabold">
				{#if average}{fr(average)}<span class="ml-1 text-base font-semibold text-soft">sur 10</span>{:else}<span class="text-base font-semibold text-soft">Non notée</span>{/if}
			</span>
		</div>
	</div>

	{#each PEOPLE as p (p.key)}
		{@const r = ratings[p.key]}
		<fieldset class="space-y-2">
			<legend class="label">
				{p.name} : {#if r}<span class="font-extrabold text-ink">{r} sur 10</span>{:else}non notée{/if}
			</legend>
			<RatingInput value={r} onchange={(n) => (ratings[p.key] = n)} />
			<textarea
				class="input min-h-20"
				name="comment{p.key}"
				placeholder="Commentaire de {p.name}"
				aria-label="Commentaire de {p.name}"
				bind:value={v[`comment${p.key}`]}
			></textarea>
		</fieldset>
	{/each}

	{#if error}
		<p class="rounded-xl bg-field p-3 font-medium text-danger">{error}</p>
	{/if}

	<button class="btn-primary w-full" disabled={submitting}>
		{submitting ? 'Enregistrement…' : submitLabel}
	</button>
</form>
