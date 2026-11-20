<script lang="ts">
	import Glass from '#lib/components/Glass.svelte';
	import { fr } from '#lib/format.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
</script>

<a href="/" class="mt-2 mb-4 inline-block text-sm text-soft">← Toutes les bières</a>

<h1 class="sr-only">Statistiques</h1>

<section>
	<p class="text-[64px] leading-none font-extrabold tracking-[-0.04em]">{data.total}</p>
	<p class="mt-1 text-lg text-soft">{data.total > 1 ? 'bières goûtées' : 'bière goûtée'}</p>
</section>

{#if data.total === 0}
	<p class="mt-8 text-soft">Les statistiques apparaîtront après la première dégustation.</p>
{:else}
	<section class="mt-10">
		<h2 class="text-xl font-extrabold">Répartition par style</h2>
		<div class="mt-3 flex h-7 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Répartition des bières par style">
			{#each data.styles as s (s.name)}
				<span
					class="h-full"
					style="flex-grow:{s.count};flex-basis:0;background:{s.color ?? 'var(--c-line)'}"
					title="{s.name} : {s.count}"
				></span>
			{/each}
		</div>
		<div class="mt-1.5 flex justify-between text-sm text-soft"><span>Clair</span><span>Foncé</span></div>
	</section>

	<section class="mt-10">
		<h2 class="text-xl font-extrabold">Top 5</h2>
		{#if data.top.length === 0}
			<p class="mt-2 text-soft">Aucune bière notée pour l’instant.</p>
		{:else}
			<ol class="mt-2">
				{#each data.top as b, i (b.id)}
					<li class="border-b border-line">
						<a href="/beer/{b.id}" class="flex items-center gap-3.5 py-3 active:opacity-70">
							<span class="w-5 text-center text-lg font-extrabold text-soft">{i + 1}</span>
							<Glass rating={b.rating} style={b.style} height={44} />
							<div class="min-w-0 flex-1">
								<p class="truncate font-semibold">{b.name}</p>
								{#if b.brewery}<p class="truncate text-sm text-soft">{b.brewery}</p>{/if}
							</div>
							<div class="text-right">
								<span class="block text-[22px] leading-none font-extrabold">{fr(b.rating!)}</span>
								<span class="text-[11px] text-soft">sur 10</span>
							</div>
						</a>
					</li>
				{/each}
			</ol>
		{/if}
	</section>

	<section class="mt-10">
		<h2 class="text-xl font-extrabold">Notes par style</h2>
		<ul class="mt-2">
			{#each data.styles as s (s.name)}
				<li class="flex items-center gap-3 border-b border-line py-3">
					<span
						class="h-4 w-4 shrink-0 rounded-full ring-1 ring-black/15"
						style="background:{s.color ?? 'var(--c-line)'}"
					></span>
					<div class="min-w-0 flex-1">
						<p class="font-semibold">{s.name}</p>
						<p class="text-sm text-soft">{plural(s.count, 'bière')}</p>
					</div>
					{#if s.average != null}
						<div class="text-right">
							<span class="block text-[22px] leading-none font-extrabold">{fr(s.average)}</span>
							<span class="text-[11px] text-soft">moyenne sur 10</span>
						</div>
					{:else}
						<span class="text-[13px] font-semibold text-soft">pas de note</span>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}
