<script lang="ts">
	import { beerColor } from '#lib/styles.ts';

	type Props = {
		rating: number | null;
		style: string | null;
		/** Rendered height in px; width follows the 34:52 glass ratio. */
		height?: number;
	};
	let { rating, style, height = 52 }: Props = $props();

	const uid = $props.id();
	const GLASS = 'M3 2h28l-3 46a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z';
	// Liquid rises from the bottom (y=51) up to y=7 for a 5/5.
	const top = $derived(rating ? 51 - (rating / 10) * 44 : 51);
	const color = $derived(beerColor(style) ?? '#cdbfb4');
</script>

<svg
	viewBox="0 0 34 52"
	width={(height * 34) / 52}
	{height}
	class="shrink-0"
	role="img"
	aria-label={rating ? `${rating} sur 10` : 'Pas encore notée'}
>
	<defs><clipPath id="glass-{uid}"><path d={GLASS} /></clipPath></defs>
	<g clip-path="url(#glass-{uid})">
		<rect width="34" height="52" fill="var(--c-field)" />
		{#if rating}
			<rect y={top} width="34" height={52 - top} fill={color} />
			<rect y={top - 3} width="34" height="4.5" fill="var(--c-foam)" />
		{/if}
	</g>
	<path
		d={GLASS}
		fill="none"
		stroke="var(--c-ink)"
		stroke-width="1.5"
		stroke-dasharray={rating ? undefined : '3 3'}
	/>
</svg>
