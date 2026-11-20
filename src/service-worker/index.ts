// Online-only app: the worker just caches immutable build assets so the app shell loads fast.
import { self as sw } from '$app/service-worker';
import { immutable } from '$app/manifest';

const files = immutable.map((f) => f.path as string);
// Immutable file names are content-hashed, so any change yields a new cache name.
const CACHE = `beerlog-${files.length}-${files[0] ?? ''}`;

sw.addEventListener('install', (event: ExtendableEvent) => {
	event.waitUntil(caches.open(CACHE).then((c) => c.addAll(files)));
	sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
	);
	sw.clients.claim();
});

sw.addEventListener('fetch', (event: FetchEvent) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== sw.location.origin) return;
	if (!files.includes(url.pathname)) return;
	event.respondWith(caches.match(url.pathname).then((r) => r ?? fetch(event.request)));
});
