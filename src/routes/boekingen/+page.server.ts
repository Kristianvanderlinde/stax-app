import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { loadTree, toOptions } from '$lib/server/categories';
import { autoCategorize, learnRule } from '$lib/server/categorize';
import { accounts } from '$lib/server/reports';
import { closeExpected, link, syncRefunds, unlink } from '$lib/server/refunds';
import { assign, classify, filtersFrom, listBookings, queryRows } from '$lib/server/bookings';
import { parseMoney } from '$lib/format';
import type { Split } from '$lib/types';

export type { Row, Status, RefundSource } from '$lib/server/bookings';

export function load({ url }) {
	const { tree, ...data } = listBookings(filtersFrom(url.searchParams));
	return { ...data, options: toOptions(tree), accounts: accounts() };
}

function idList(v: FormDataEntryValue | null): number[] {
	return String(v ?? '')
		.split(',')
		.map(Number)
		.filter((n) => Number.isInteger(n) && n > 0)
		.slice(0, 600);
}

export const actions = {
	/** Tabelweergave: één boeking direct indelen vanuit de keuzelijst. */
	snel: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const categoryId = Number(form.get('category_id')) || null;
		if (!assign([id], categoryId)) return fail(400, { error: 'Deze budget past niet bij deze boeking.' });
		const applied = categoryId && form.get('remember') && learnRule(id, categoryId) ? autoCategorize() : 0;
		return { applied };
	},

	/** Meerdere geselecteerde boekingen in één keer indelen of (niet) laten meetellen. */
	bulk: async ({ request }) => {
		const form = await request.formData();
		const ids = idList(form.get('ids'));
		if (!ids.length) return fail(400, { error: 'Selecteer eerst boekingen.' });
		if (form.get('excluded') != null) {
			db.prepare(`UPDATE transactions SET excluded = ? WHERE id IN (${ids.join(',')})`).run(form.get('excluded') === '1' ? 1 : 0);
			return { bulk: ids.length };
		}
		// Uit de pot of van de lopende rekening: geldt voor de delen die al op een budget staan.
		if (form.get('uit_pot') != null) {
			const r = db.prepare(`UPDATE splits SET from_pot = ? WHERE transaction_id IN (${ids.join(',')})`).run(form.get('uit_pot') === '1' ? 1 : 0);
			syncRefunds(ids);
			return { bulk: Number(r.changes) };
		}
		const categoryId = Number(form.get('category_id')) || null;
		return { bulk: assign(ids, categoryId) };
	},

	indelen: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		let splits: Split[];
		try {
			splits = JSON.parse(String(form.get('splits') ?? '[]')) as Split[];
		} catch {
			return fail(400, { error: 'Ongeldige indeling.' });
		}
		const result = classify(id, {
			splits,
			fromPot: form.get('uit_pot') === '0' ? 0 : 1,
			note: String(form.get('note') ?? ''),
			excluded: !!form.get('excluded'),
			refund: form.get('terug') ? (parseMoney(String(form.get('terug_bedrag') ?? '')) ?? 0) : null,
			remember: !!form.get('remember')
		});
		if ('error' in result) return fail(result.status, { error: result.error });
		// Verse stand van de boekingen die in het indeelvenster op een rij staan, zodat vorige/volgende blijft werken.
		const queue = String(form.get('queue') ?? '')
			.split(',')
			.map(Number)
			.filter(Number.isInteger)
			.slice(0, 600);
		const rows = queue.length ? queryRows([`t.id IN (${queue.join(',')})`], []) : [];
		return { saved: id, applied: result.applied, rows };
	},

	/** Een binnenkomende boeking koppelen aan de uitgave waarvoor je geld terugkreeg, of ontkoppelen. */
	koppel: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		const of = Number(form.get('of'));
		if (!of) {
			unlink(id);
			return { linked: 0 };
		}
		const problem = link(id, of);
		if (problem) return fail(400, { error: problem });
		return { linked: of };
	},

	/** Niets meer terugverwachten voor een uitgave. */
	afsluiten: async ({ request }) => {
		const form = await request.formData();
		closeExpected(Number(form.get('id')));
		return { closed: true };
	}
};
