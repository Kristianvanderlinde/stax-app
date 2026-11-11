import { error, json } from '@sveltejs/kit';
import { deleteUser } from '$lib/server/auth';

export function DELETE({ params, locals }) {
	const id = Number(params.id);
	if (id === locals.user?.id) error(400, 'Je kunt je eigen account hier niet verwijderen.');
	deleteUser(id);
	return json({ ok: true });
}
