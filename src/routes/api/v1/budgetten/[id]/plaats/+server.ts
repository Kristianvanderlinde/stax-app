import { error, json } from '@sveltejs/kit';
import { MapError, placeMap } from '$lib/server/maps';

/** Zet een budget of groep op een nieuwe plek: { parent_id, before_id? } (zonder before_id achteraan). */
export async function POST({ params, request }) {
	const b = await request.json().catch(() => null);
	if (!b || !Number.isInteger(b.parent_id)) error(400, 'Geef de groep op.');
	try {
		placeMap(Number(params.id), b.parent_id, Number.isInteger(b.before_id) ? b.before_id : null);
		return json({ ok: true });
	} catch (e) {
		if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
}
