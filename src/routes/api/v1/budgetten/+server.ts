import { error, json } from '@sveltejs/kit';
import { groupChoices } from '$lib/server/api';
import { MapError, createGroup, createMap } from '$lib/server/maps';

/** De groepen waaruit je kunt kiezen. */
export function GET() {
	return json(groupChoices());
}

/** Nieuw budget ({ parent_id, name, kind }) of nieuwe groep ({ group: true, name }). Geeft het nieuwe id terug. */
export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	if (!body || typeof body.name !== 'string') error(400, 'Geef een naam op.');
	try {
		const id = body.group ? createGroup(body.name) : createMap(Number(body.parent_id), body.name, typeof body.kind === 'string' ? body.kind : null);
		return json({ id });
	} catch (e) {
		if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
}
