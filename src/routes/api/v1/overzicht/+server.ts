import { json } from '@sveltejs/kit';
import { overview } from '$lib/server/api';

export function GET({ url }) {
	return json(overview(url.searchParams.get('maand')));
}
