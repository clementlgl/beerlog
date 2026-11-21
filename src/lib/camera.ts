/**
 * Back-camera stream tuned for close-up barcode reading.
 *
 * On many phones `facingMode: 'environment'` opens the ultra-wide lens, which has a fixed
 * focus and cannot focus on a bottle held 10-20 cm away. We therefore look for a back camera
 * that reports continuous autofocus, remember it, and zoom in a little so the code can be
 * read from further away (where any lens is sharper).
 */

type FocusCapabilities = MediaTrackCapabilities & {
	focusMode?: string[];
	zoom?: { min: number; max: number; step?: number };
};
type FocusConstraints = MediaTrackConstraintSet & { focusMode?: string; zoom?: number };

const STORAGE_KEY = 'beerlog.cameraId';
const RESOLUTION = { width: { ideal: 1920 }, height: { ideal: 1080 } };

const caps = (track: MediaStreamTrack): FocusCapabilities =>
	(track.getCapabilities?.() ?? {}) as FocusCapabilities;

const hasAutofocus = (track: MediaStreamTrack) =>
	caps(track).focusMode?.includes('continuous') ?? false;

function remember(id: string | undefined) {
	try {
		if (id) localStorage.setItem(STORAGE_KEY, id);
	} catch {
		/* storage unavailable */
	}
}

function remembered(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

async function open(video: MediaTrackConstraints): Promise<MediaStream> {
	return navigator.mediaDevices.getUserMedia({ video: { ...RESOLUTION, ...video }, audio: false });
}

const stop = (s: MediaStream) => s.getTracks().forEach((t) => t.stop());

/** Opens the best back camera and applies autofocus + zoom when the device supports them. */
export async function openBarcodeCamera(): Promise<MediaStream> {
	// 1. Camera that worked last time
	const saved = remembered();
	if (saved) {
		try {
			const s = await open({ deviceId: { exact: saved } });
			await tune(s.getVideoTracks()[0]);
			return s;
		} catch {
			/* camera gone: search again */
		}
	}

	// 2. Default back camera; keep it if it can autofocus
	let stream = await open({ facingMode: { ideal: 'environment' } });
	let track = stream.getVideoTracks()[0];

	// 3. Otherwise try the other back cameras (labels are known once permission is granted)
	//    Phones usually open one camera at a time: release the default one while probing.
	if (!hasAutofocus(track) && caps(track).focusMode) {
		const defaultId = track.getSettings().deviceId;
		const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
			(d) =>
				d.kind === 'videoinput' && d.deviceId !== defaultId && !/front|avant|user/i.test(d.label)
		);
		stop(stream);
		let found: MediaStream | null = null;
		for (const d of devices) {
			try {
				const candidate = await open({ deviceId: { exact: d.deviceId } });
				if (hasAutofocus(candidate.getVideoTracks()[0])) {
					found = candidate;
					break;
				}
				stop(candidate);
			} catch {
				/* camera busy or not allowed */
			}
		}
		stream = found ?? (await open(defaultId ? { deviceId: { exact: defaultId } } : { facingMode: 'environment' }));
		track = stream.getVideoTracks()[0];
	}

	remember(track.getSettings().deviceId);
	await tune(track);
	return stream;
}

async function tune(track: MediaStreamTrack) {
	const c = caps(track);
	const advanced: FocusConstraints[] = [];
	if (c.focusMode?.includes('continuous')) advanced.push({ focusMode: 'continuous' });
	// A bit of zoom lets the phone stay at a distance where the lens can focus
	if (c.zoom && c.zoom.max > 1) advanced.push({ zoom: Math.min(2, c.zoom.max) });
	for (const constraint of advanced) {
		try {
			await track.applyConstraints({ advanced: [constraint] });
		} catch {
			/* not supported on this device */
		}
	}
}

/** Tap-to-focus: one autofocus pass, then back to continuous. */
export async function refocus(stream: MediaStream | null) {
	const track = stream?.getVideoTracks()[0];
	if (!track) return;
	const modes = caps(track).focusMode ?? [];
	try {
		if (modes.includes('single-shot')) {
			await track.applyConstraints({ advanced: [{ focusMode: 'single-shot' } as FocusConstraints] });
		}
		if (modes.includes('continuous')) {
			await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as FocusConstraints] });
		}
	} catch {
		/* not supported */
	}
}
