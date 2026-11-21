<script lang="ts">
	import { onMount } from 'svelte';
	import { openBarcodeCamera, refocus } from '#lib/camera.ts';

	type Props = { ondetect: (code: string) => void; onclose: () => void };
	let { ondetect, onclose }: Props = $props();

	let video: HTMLVideoElement;
	let error = $state<string | null>(null);
	let stream: MediaStream | null = null;

	const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'] as const;

	type Detector = { detect(src: HTMLVideoElement): Promise<{ rawValue: string }[]> };

	async function makeDetector(): Promise<Detector> {
		// Native API (Chrome Android) when it supports EAN, otherwise the ZXing WASM ponyfill.
		const Native = (globalThis as unknown as { BarcodeDetector?: any }).BarcodeDetector; // eslint-disable-line @typescript-eslint/no-explicit-any
		if (Native) {
			const supported: string[] = await Native.getSupportedFormats();
			if (supported.includes('ean_13')) return new Native({ formats: FORMATS });
		}
		const [{ BarcodeDetector, prepareZXingModule }, { default: wasmUrl }] = await Promise.all([
			import('barcode-detector/ponyfill'),
			import('zxing-wasm/reader/zxing_reader.wasm?url')
		]);
		prepareZXingModule({
			overrides: {
				locateFile: (path: string, prefix: string) =>
					path.endsWith('.wasm') ? wasmUrl : prefix + path
			}
		});
		return new BarcodeDetector({ formats: [...FORMATS] });
	}

	onMount(() => {
		let timer: ReturnType<typeof setTimeout>;
		let stopped = false;

		(async () => {
			if (!navigator.mediaDevices?.getUserMedia) {
				error = 'Caméra indisponible (HTTPS requis).';
				return;
			}
			try {
				stream = await openBarcodeCamera();
			} catch {
				error = 'Accès à la caméra refusé.';
				return;
			}
			if (stopped) return stream?.getTracks().forEach((t) => t.stop());
			video.srcObject = stream;
			await video.play();
			const detector = await makeDetector();

			const tick = async () => {
				if (stopped) return;
				try {
					const codes = await detector.detect(video);
					if (codes.length) {
						navigator.vibrate?.(80);
						ondetect(codes[0].rawValue);
						return;
					}
				} catch {
					/* frame not ready */
				}
				timer = setTimeout(tick, 200);
			};
			tick();
		})();

		return () => {
			stopped = true;
			clearTimeout(timer);
			stream?.getTracks().forEach((t) => t.stop());
		};
	});
</script>

<div class="fixed inset-0 z-50 flex flex-col bg-black">
	<div class="relative flex-1 overflow-hidden">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={video}
			class="h-full w-full object-cover"
			playsinline
			muted
			onclick={() => refocus(stream)}
		></video>
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="h-32 w-72 rounded-xl border-4 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"></div>
		</div>
		{#if error}
			<p class="absolute inset-x-4 top-1/3 rounded-lg bg-red-600 p-3 text-center text-white">{error}</p>
		{/if}
	</div>
	<div class="flex items-center justify-between gap-4 p-4 text-white">
		<p class="text-sm opacity-80">Tenez le code-barres à 15–20 cm. Touchez l’image pour refaire la mise au point.</p>
		<button class="rounded-lg bg-white/15 px-4 py-2 font-medium" onclick={onclose}>Fermer</button>
	</div>
</div>
