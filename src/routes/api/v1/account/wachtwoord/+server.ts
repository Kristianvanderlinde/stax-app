import { error, json } from '@sveltejs/kit';
import { changePassword } from '$lib/server/auth';

/** Wachtwoord wijzigen. Body: { current, next, repeat }. Andere telefoons en sessies worden uitgelogd, deze telefoon blijft. */
export async function POST({ request, locals }) {
	if (!locals.user) error(401, 'Niet ingelogd.');
	const b = await request.json().catch(() => null);
	const device = (locals.user as { device?: number }).device;
	const problem = changePassword(locals.user.id, String(b?.current ?? ''), String(b?.next ?? ''), String(b?.repeat ?? ''), { device });
	if (problem) return json({ error: problem }, { status: 400 });
	return json({ ok: true });
}
