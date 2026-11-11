import { json } from '@sveltejs/kit';
import { listDevices, listUsers } from '$lib/server/auth';

export function GET({ locals }) {
	return json({ me: locals.user, users: listUsers(), devices: listDevices() });
}
