import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

/** Naam en soort ('betaal' of 'spaar') van een rekening. */
export async function PUT({ params, request }) {
	const b = await request.json().catch(() => null);
	const name = typeof b?.name === 'string' ? b.name.trim() : '';
	if (!name) error(400, 'Geef de rekening een naam.');
	const done = db.prepare('UPDATE accounts SET name = ?, kind = ? WHERE id = ?').run(name, b.kind === 'spaar' ? 'spaar' : 'betaal', Number(params.id));
	if (!done.changes) error(404, 'Rekening niet gevonden.');
	return json({ ok: true });
}
