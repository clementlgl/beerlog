<script lang="ts">
	type Props = { value: number | null; onchange: (v: number | null) => void };
	let { value, onchange }: Props = $props();

	// Tapping the current value again clears the rating.
	const pick = (n: number) => onchange(value === n ? null : n);
</script>

<div class="grid grid-cols-10 gap-1" role="radiogroup" aria-label="Note sur 10">
	{#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as n (n)}
		<button
			type="button"
			role="radio"
			aria-checked={value === n}
			aria-label="{n} sur 10"
			class="h-11 rounded-lg text-[15px] font-semibold transition-colors {value && n <= value
				? 'bg-ink text-paper'
				: 'bg-field text-soft'} {value === n ? 'ring-2 ring-ink ring-offset-2 ring-offset-paper' : ''}"
			onclick={() => pick(n)}>{n}</button
		>
	{/each}
</div>
