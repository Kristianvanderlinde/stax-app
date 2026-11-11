import { json } from '@sveltejs/kit';
import { accounts } from '$lib/server/reports';

export function GET() {
	return json({ accounts: accounts() });
}
