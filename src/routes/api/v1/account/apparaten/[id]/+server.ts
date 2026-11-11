import { json } from '@sveltejs/kit';
import { revokeDevice } from '$lib/server/auth';

/** Een telefoon de toegang afnemen; hij moet dan opnieuw inloggen. */
export function DELETE({ params }) {
	revokeDevice(Number(params.id));
	return json({ ok: true });
}
