import { db } from '$lib/server/db';

/** Voor het deploy-script: antwoordt "ok" als de app draait en de database leesbaar is. */
export function GET() {
	db.prepare('SELECT 1').get();
	return new Response('ok');
}
