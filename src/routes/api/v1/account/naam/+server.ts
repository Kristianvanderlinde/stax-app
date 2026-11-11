import { error, json } from '@sveltejs/kit';
import { changeName } from '$lib/server/auth';

/** Eigen naam wijzigen. Body: { name }. */
export async function PUT({ request, locals }) {
	if (!locals.user) error(401, 'Niet ingelogd.');
	const b = await request.json().catch(() => null);
	const problem = changeName(locals.user.id, String(b?.name ?? ''));
	if (problem) return json({ error: problem }, { status: 400 });
	return json({ ok: true });
}
