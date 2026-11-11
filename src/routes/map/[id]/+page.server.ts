import { error, fail } from '@sveltejs/kit';
import { setBudget } from '$lib/server/budgets';
import { parseMoney } from '$lib/format';
import { db } from '$lib/server/db';
import { browseOrder, isBudgetId, isGroup, loadTree, subtreeIds, toOptions, type CategoryTree } from '$lib/server/categories';
import { Ledger, currentMonth, lastBookingDate, rowsUnder, shiftMonth } from '$lib/server/reports';
import { figures } from '$lib/figures';
import type { CatNode, NodeStats } from '$lib/types';

function find(n: NodeStats, id: number): NodeStats | null {
	if (n.id === id) return n;
	for (const c of n.children) {
		const hit = find(c, id);
		if (hit) return hit;
	}
	return null;
}

function neighbours(tree: CategoryTree, node: CatNode) {
	const list = browseOrder(tree, isGroup(node));
	const i = list.findIndex((n) => n.id === node.id);
	const pick = (n: CatNode | undefined) => (n ? { id: n.id, name: n.name } : null);
	return { prev: pick(list[i - 1]), next: pick(list[i + 1]), groups: isGroup(node) };
}

export function load({ params, url }) {
	const id = Number(params.id);
	const tree = loadTree();
	const node = tree.byId.get(id);
	if (!node) error(404, 'Budget niet gevonden');

	const ledger = new Ledger(tree);
	const month = url.searchParams.get('maand') ?? lastBookingDate()?.slice(0, 7) ?? currentMonth();
	const root = (m: string) => {
		const r = ledger.month(m);
		return node.tree === 'inkomsten' ? r.inkomsten : r.uitgaven;
	};

	// Een jaar terug, maar niet verder dan de eerste maand met gegevens.
	const firstData = (db.prepare('SELECT MIN(booking_date) AS d FROM transactions').get() as { d: string | null }).d?.slice(0, 7) ?? month;
	const start = shiftMonth(month, -11) > firstData ? shiftMonth(month, -11) : firstData;
	const months: string[] = [];
	for (let m = start; m <= month; m = shiftMonth(m, 1)) months.push(m);
	const history = months.map((m) => ({ month: m, deviates: ledger.budgets.override(id, m) !== null, ...figures(find(root(m), id)!) }));

	const stats = find(root(month), id)!;
	const ids = subtreeIds(node);
	const bookings = db
		.prepare(
			`SELECT t.id, t.booking_date, t.counterparty, t.description, t.transfer_account_id, s.amount_cents, c.name AS category
			 FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN categories c ON c.id = s.category_id
			 WHERE t.excluded = 0 AND s.category_id IN (${ids.join(',')}) AND substr(t.booking_date, 1, 7) = ?
			 ORDER BY t.booking_date DESC, t.id DESC`
		)
		.all(month) as { id: number; booking_date: string; counterparty: string | null; description: string; transfer_account_id: number | null; amount_cents: number; category: string }[];

	return {
		month,
		stats,
		figures: figures(stats),
		node: { id: node.id, name: node.name, path: node.path, tree: node.tree, depth: node.depth, funding: node.effFunding, group: isGroup(node), count: node.children.length },
		history,
		bookings,
		showCategory: ids.length > 1,
		// Submappen met hun cijfers, voor een map die zelf weer mappen bevat.
		children: node.children.length ? rowsUnder(stats) : [],
		options: toOptions(tree),
		// Bladeren: het vorige en volgende budget (of de vorige en volgende groep) in de volgorde van het overzicht.
		nav: neighbours(tree, node),
		budget: {
			editable: !isGroup(node),
			amount: ledger.budgets.amount(id, month),
			template: ledger.budgets.template(id, month),
			override: ledger.budgets.override(id, month)
		}
	};
}

export const actions = {
	/** Budget (of geplande inleg) vastleggen voor alleen deze maand of vanaf deze maand. */
	budget: async ({ request, params }) => {
		const form = await request.formData();
		const id = Number(params.id);
		const month = String(form.get('month') ?? '');
		if (!/^\d{4}-\d{2}$/.test(month)) return fail(400, { error: 'Ongeldige maand.' });
		const raw = String(form.get('amount') ?? '').trim();
		const amount = raw === '' ? 0 : parseMoney(raw);
		if (amount === null || amount < 0) return fail(400, { error: 'Vul een geldig bedrag in.' });
		if (!isBudgetId(loadTree(), id)) return fail(400, { error: 'Een groep heeft geen eigen budget; het totaal komt van de budgetten eronder.' });
		setBudget(id, month, amount, form.get('scope') === 'alleen' ? 'alleen' : 'vanaf');
		return { saved: true };
	},
	/** Afwijking van deze maand weghalen, zodat het standaardbedrag weer geldt. */
	herstel: async ({ request, params }) => {
		const form = await request.formData();
		setBudget(Number(params.id), String(form.get('month')), null, 'alleen');
		return { saved: true };
	}
};
