import { json } from '@sveltejs/kit';
import { savings } from '$lib/server/api';

export function GET() {
	return json(savings());
}
