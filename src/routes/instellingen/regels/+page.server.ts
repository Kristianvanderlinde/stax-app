import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { isBudgetId, loadTree, toOptions } from '$lib/server/categories';
import { autoCategorize } from '$lib/server/categorize';

export function load() {
	const rules = db
		.prepare("SELECT id, field, op, pattern, category_id FROM rules ORDER BY field = 'mcc', created_at DESC, id DESC")
		.all() as { id: number; field: string; op: string; pattern: string; category_id: number }[];
	return { rules, options: toOptions(loadTree()) };
}

export const actions = {
	regel: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (form.get('delete')) {
			db.prepare('DELETE FROM rules WHERE id = ?').run(id);
		} else {
			const category = Number(form.get('category_id'));
			if (!isBudgetId(loadTree(), category)) return fail(400, { error: 'Kies een budget, geen groep.' });
			db.prepare('UPDATE rules SET category_id = ? WHERE id = ?').run(category, id);
			autoCategorize();
		}
		return { ok: true };
	},
	nieuw: async ({ request }) => {
		const form = await request.formData();
		const field = String(form.get('field'));
		const op = form.get('op') === 'bevat' ? 'bevat' : 'is';
		const pattern = String(form.get('pattern') ?? '').trim();
		const category = Number(form.get('category_id'));
		if (!pattern || !category || !['iban', 'tegenpartij', 'omschrijving', 'mcc'].includes(field))
			return fail(400, { error: 'Vul alle velden van de regel in.' });
		if (!isBudgetId(loadTree(), category)) return fail(400, { error: 'Kies een budget, geen groep.' });
		db.prepare(
			`INSERT INTO rules (field, op, pattern, category_id) VALUES (?, ?, ?, ?)
			 ON CONFLICT(field, op, pattern) DO UPDATE SET category_id = excluded.category_id`
		).run(field, op, field === 'iban' ? pattern.toUpperCase().replace(/\s/g, '') : pattern.toLowerCase(), category);
		return { applied: autoCategorize() };
	}
};
