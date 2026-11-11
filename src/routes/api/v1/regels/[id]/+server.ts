import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { isBudgetId, loadTree } from '$lib/server/categories';
import { autoCategorize } from '$lib/server/categorize';

/** Een regel naar een ander budget verwijzen ({ category_id }). */
export async function PUT({ params, request }) {
	const b = await request.json().catch(() => null);
	const category = Number(b?.category_id);
	if (!isBudgetId(loadTree(), category)) error(400, 'Kies een budget, geen groep.');
	db.prepare('UPDATE rules SET category_id = ? WHERE id = ?').run(category, Number(params.id));
	return json({ applied: autoCategorize() });
}

export function DELETE({ params }) {
	db.prepare('DELETE FROM rules WHERE id = ?').run(Number(params.id));
	return json({ ok: true });
}
