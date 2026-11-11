import { json } from '@sveltejs/kit';
import { ordering } from '$lib/server/api';

/** Groepen, budgetten en inkomsten in hun huidige volgorde; verplaatsen gaat met `/budgetten/<id>/plaats`. */
export function GET() {
	return json(ordering());
}
