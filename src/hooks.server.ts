import type { Handle } from '@sveltejs/kit/hooks';

/**
 * Identity comes from `tailscale serve`, which injects Tailscale-User-* headers.
 * The app must only listen on 127.0.0.1 so nobody can bypass serve and forge them.
 * Non-ASCII values are RFC 2047 encoded (=?utf-8?q?...?=).
 */
function decodeHeader(value: string | null): string | null {
	if (!value) return null;
	const m = /^=\?utf-8\?q\?(.*)\?=$/i.exec(value);
	if (!m) return value;
	const bytes = m[1]
		.replace(/_/g, ' ')
		.replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
	return new TextDecoder().decode(Uint8Array.from(bytes, (c) => c.charCodeAt(0)));
}

export const handle: Handle = async ({ event, resolve }) => {
	const login = decodeHeader(event.request.headers.get('tailscale-user-login')) ?? process.env.DEV_USER;
	if (!login) {
		return new Response('Accès refusé : passez par Tailscale.', { status: 403 });
	}
	const name = decodeHeader(event.request.headers.get('tailscale-user-name')) ?? login.split('@')[0];
	event.locals.user = { login, name };
	return resolve(event);
};
