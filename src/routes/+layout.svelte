<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<header class="bg-paper pt-[env(safe-area-inset-top)]">
	<div class="mx-auto flex max-w-2xl items-center justify-between px-5 pt-5 pb-2">
		<a href="/" class="text-[26px] leading-none font-extrabold tracking-[-0.02em]">BeerLog</a>
		<div class="flex items-center gap-4">
			{#if page.url.pathname !== '/stats'}
				<a href="/stats" class="text-[15px] font-semibold text-soft">Statistiques</a>
			{/if}
			{#if page.url.pathname !== '/settings'}
				<a href="/settings" class="text-soft" aria-label="Réglages">
					<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
				</a>
			{/if}
		</div>
	</div>
</header>

<main class="mx-auto max-w-2xl px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
	{@render children()}
</main>

{#if page.url.pathname === '/'}
	<a
		href="/add"
		class="fixed right-[max(1.25rem,calc(50vw-21rem+1.25rem))] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 grid h-16 w-16 place-items-center rounded-full bg-ink text-paper shadow-[0_10px_24px_-8px_rgba(58,36,24,0.55)] active:scale-95"
		aria-label="Ajouter une bière"
	>
		<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">
			<path d="M12 5v14M5 12h14" />
		</svg>
	</a>
{/if}
