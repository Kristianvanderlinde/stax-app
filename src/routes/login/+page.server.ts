import { fail, redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, SESSION_DAYS, blocked, clientIp, createSession, recordFailure, setupCode, verifyLogin } from '$lib/server/auth';

export function load({ locals }) {
	if (setupCode()) redirect(303, '/setup');
	if (locals.user) redirect(303, '/');
}

export const actions = {
	default: async ({ request, cookies, getClientAddress, url }) => {
		const ip = clientIp(request, getClientAddress);
		if (blocked(ip)) return fail(429, { error: 'Te veel pogingen. Probeer het over een kwartier opnieuw.', name: '' });
		const form = await request.formData();
		const name = String(form.get('name') ?? '');
		const user = verifyLogin(name, String(form.get('password') ?? ''), String(form.get('code') ?? ''));
		if (!user) {
			recordFailure(ip);
			return fail(400, { error: 'Naam, wachtwoord of code klopt niet.', name });
		}
		cookies.set(SESSION_COOKIE, createSession(user.id), { path: '/', httpOnly: true, sameSite: 'lax', maxAge: SESSION_DAYS * 86_400 });
		// Alleen naar een pad binnen Stax terugsturen.
		const next = url.searchParams.get('naar');
		redirect(303, next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
	}
};
