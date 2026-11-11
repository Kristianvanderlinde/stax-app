import { fail } from '@sveltejs/kit';
import { SESSION_COOKIE, changeName, changePassword, listDevices, revokeDevice } from '$lib/server/auth';

export function load({ locals }) {
	return { me: locals.user, devices: listDevices() };
}

export const actions = {
	/** Een telefoon met de app de toegang afnemen; hij moet dan opnieuw inloggen. */
	apparaat: async ({ request }) => {
		revokeDevice(Number((await request.formData()).get('id')));
		return { revoked: true };
	},
	naam: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Je bent niet ingelogd.', which: 'naam' });
		const problem = changeName(locals.user.id, String((await request.formData()).get('name') ?? ''));
		if (problem) return fail(400, { error: problem, which: 'naam' });
		return { saved: 'naam' };
	},
	wachtwoord: async ({ request, locals, cookies }) => {
		if (!locals.user) return fail(401, { error: 'Je bent niet ingelogd.', which: 'wachtwoord' });
		const f = await request.formData();
		const problem = changePassword(locals.user.id, String(f.get('current') ?? ''), String(f.get('next') ?? ''), String(f.get('repeat') ?? ''), { sessionToken: cookies.get(SESSION_COOKIE) });
		if (problem) return fail(400, { error: problem, which: 'wachtwoord' });
		return { saved: 'wachtwoord' };
	}
};
