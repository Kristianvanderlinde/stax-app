import { json } from '@sveltejs/kit';
import { revokeDevice } from '$lib/server/auth';

/** Uitloggen in de app: de sleutel van dit apparaat vervalt. */
export function POST({ locals }) {
	const device = (locals.user as { device?: number } | null)?.device;
	if (device) revokeDevice(device);
	return json({ ok: true });
}
