import { error, json } from '@sveltejs/kit';
import { budget } from '$lib/server/api';
import { MapError, deleteMap, updateMap } from '$lib/server/maps';

export function GET({ params, url }) {
	const data = budget(Number(params.id), url.searchParams.get('maand'));
	if (!data) error(404, 'Budget niet gevonden.');
	return json(data);
}

/** Naam, icoon, soort, geldplek, doel en groep. Het hele record in één keer: wat ontbreekt, wordt leeg. */
export async function PUT({ params, request }) {
	const b = await request.json().catch(() => null);
	if (!b || typeof b.name !== 'string') error(400, 'Geef een naam op.');
	try {
		updateMap(Number(params.id), {
			name: b.name,
			icon: typeof b.icon === 'string' ? b.icon : '',
			kind: typeof b.kind === 'string' ? b.kind : '',
			funding: typeof b.funding === 'string' ? b.funding : '',
			goalCents: Number.isInteger(b.goal_cents) ? b.goal_cents : null,
			goalDate: typeof b.goal_date === 'string' ? b.goal_date : '',
			parentId: Number.isInteger(b.parent_id) ? b.parent_id : null
		});
		return json({ ok: true });
	} catch (e) {
		if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
}

/** Een budget of lege groep verwijderen. */
export function DELETE({ params }) {
	try {
		deleteMap(Number(params.id));
		return json({ ok: true });
	} catch (e) {
		if (e instanceof MapError) return json({ error: e.message }, { status: 400 });
		throw e;
	}
}
