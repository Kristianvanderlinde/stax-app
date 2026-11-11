import { json, redirect, type Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { SESSION_COOKIE, deviceUser, sessionUser, setupCode } from '$lib/server/auth';

// In productie moet je altijd ingelogd zijn. Lokaal ontwikkelen kan zonder, tenzij STAX_AUTH=on.
export const AUTH = !dev || process.env.STAX_AUTH === 'on';
const PUBLIC = ['/login', '/setup', '/health', '/api/v1/login'];

// Toon de installatiecode meteen bij het opstarten als er nog geen account is.
if (AUTH) setupCode();

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	// De app stuurt zijn apparaatsleutel mee als Bearer-token; de website gebruikt de sessiecookie.
	if (path.startsWith('/api/')) {
		const bearer = event.request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
		event.locals.user = AUTH || bearer ? deviceUser(bearer) : { id: 0, name: 'lokaal' };
		if (!event.locals.user && !PUBLIC.includes(path)) return json({ error: 'Niet ingelogd.' }, { status: 401 });
		return resolve(event);
	}
	event.locals.user = AUTH ? sessionUser(event.cookies.get(SESSION_COOKIE)) : { id: 0, name: 'lokaal' };
	if (AUTH && !event.locals.user && !PUBLIC.some((p) => path === p || path.startsWith(p + '/'))) {
		redirect(303, setupCode() ? '/setup' : `/login${path === '/' ? '' : `?naar=${encodeURIComponent(path + event.url.search)}`}`);
	}
	const response = await resolve(event);
	// Niet in een frame laten tonen en geen verwijzer meesturen naar andere sites.
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'same-origin');
	return response;
};
