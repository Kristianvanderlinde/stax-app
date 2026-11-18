import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { isBudgetId, loadTree, toOptions } from '$lib/server/categories';
import { autoCategorize } from '$lib/server/categorize';

/** Regels plus de budgetten waaruit je kunt kiezen. */
export function GET() {
	const tree = loadTree();
	const rules = db
		.prepare("SELECT id, field, op, pattern, category_id FROM rules ORDER BY field = 'mcc', created_at DESC, id DESC")
		.all();
	const opties = new Map(toOptions(tree).map((o) => [o.id, o]));
	const budgets = tree.flat
		.filter((n) => isBudgetId(tree, n.id))
		.map((n) => ({ id: n.id, name: n.name, path: n.path.join(' › '), icon: opties.get(n.id)?.icon ?? null, hue: opties.get(n.id)?.hue ?? null }));
	return json({ rules, budgets });
}

/** Nieuwe regel; een bestaande met hetzelfde patroon krijgt het nieuwe budget. Deelt meteen boekingen in. */
export async function POST({ request }) {
	const b = await request.json().catch(() => null);
	const field = String(b?.field ?? '');
	const op = b?.op === 'bevat' ? 'bevat' : 'is';
	const pattern = String(b?.pattern ?? '').trim();
	const category = Number(b?.category_id);
	if (!pattern || !category || !['iban', 'tegenpartij', 'omschrijving', 'mcc'].includes(field)) error(400, 'Vul alle velden van de regel in.');
	if (!isBudgetId(loadTree(), category)) error(400, 'Kies een budget, geen groep.');
	db.prepare(
		`INSERT INTO rules (field, op, pattern, category_id) VALUES (?, ?, ?, ?)
		 ON CONFLICT(field, op, pattern) DO UPDATE SET category_id = excluded.category_id`
	).run(field, op, field === 'iban' ? pattern.toUpperCase().replace(/\s/g, '') : pattern.toLowerCase(), category);
	return json({ applied: autoCategorize() });
}
