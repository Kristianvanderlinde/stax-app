import { db } from './db';
import { isGroup, loadTree, subtreeIds } from './categories';
import { Ledger, accountBalance, incomeSummary, accounts, currentMonth, isOpenSql, lastBookingDate, monthEnd, monthRows, openCounts, plannedTotal, rowsUnder, shiftMonth } from './reports';
import { openRefunds } from './refunds';
import { hueMap } from './hues';
import { figures, type Figures } from '$lib/figures';
import { kindOf, kindTag, type NodeStats } from '$lib/types';

// Gegevens voor de iOS-app, kant-en-klaar berekend: de app rekent zelf niets uit, zodat website en app
// altijd hetzelfde laten zien. Bedragen in centen.

export interface ApiRow {
	id: number;
	/** Kleur van de groep waar dit bij hoort: accent, lucht, koraal, mint of zon. */
	hue: string;
	name: string;
	icon: string | null;
	/** Inspringing binnen de groep: 0 direct eronder. */
	level: number;
	group: boolean;
	kind: Figures['kind'];
	/** "", "Spaart", "Spaart · doel" of "Groep · 3 budgetten". */
	subtitle: string;
	plan: number;
	net: number;
	balance: number | null;
	bar: Figures['bar'];
	toWithdraw: number;
}

function subtitle(n: NodeStats, f: Figures): string {
	if (n.children.length) return `Groep · ${n.children.length} ${n.children.length === 1 ? 'budget' : 'budgetten'}`;
	if (f.kind === 'inkomsten') return '';
	return kindTag(f.kind);
}

function row(n: NodeStats, level = 0, hues: Map<number, string>): ApiRow {
	const f = figures(n);
	return {
		id: n.id,
		hue: hues.get(n.id) ?? 'accent',
		name: n.name,
		icon: n.icon,
		level,
		group: n.children.length > 0,
		kind: f.kind,
		subtitle: subtitle(n, f),
		plan: f.plan ?? 0,
		net: f.net,
		balance: f.balance,
		bar: f.bar,
		toWithdraw: n.toWithdraw
	};
}

function months(): string[] {
	return (db.prepare('SELECT DISTINCT substr(booking_date, 1, 7) AS m FROM transactions ORDER BY m DESC').all() as { m: string }[]).map((r) => r.m);
}

function defaultMonth(month: string | null): string {
	return month && /^\d{4}-\d{2}$/.test(month) ? month : (lastBookingDate()?.slice(0, 7) ?? currentMonth());
}

/** Budgetoverzicht van één maand. */
export function overview(monthParam: string | null) {
	const month = defaultMonth(monthParam);
	const hues = hueMap();
	const { uitgaven, inkomsten } = new Ledger(loadTree()).month(month);
	const planned = plannedTotal(uitgaven);
	const refunds = openRefunds();
	const income = incomeSummary(inkomsten, month);
	return {
		month,
		months: months(),
		totals: {
			inkomsten: income.received,
			/** Verwacht inkomen deze maand (0 als er niets is ingevuld). */
			expected: income.expected,
			uitgaven: -uitgaven.flow || 0,
			planned,
			/** Verwacht inkomen min gebudgetteerd (ontvangen als er niets verwacht is). */
			toDistribute: income.base - planned,
			toDistributeBasis: income.expected ? 'verwacht inkomen' : 'inkomsten',
			incomeNote: income.note
		},
		open: openCounts(month).n,
		/** Alle boekingen die nog ingedeeld moeten worden, over alle maanden (voor het bolletje bij Boekingen). */
		openTotal: (db.prepare(`SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE ${isOpenSql()}`).get() as { n: number }).n,
		refunds: { n: refunds.length, cents: refunds.reduce((s, e) => s + e.expected - e.received, 0) },
		groups: monthRows(uitgaven).map(({ group, rows }) => ({ ...row(group, 0, hues), rows: rows.map((r) => row(r.node, r.level, hues)) })),
		/** Inkomstenrijen: plan is het verwachte bedrag, net wat er binnenkwam. */
		income: rowsUnder(inkomsten).map((r) => row(r.node, r.level, hues))
	};
}

/** Alle spaarpotten per groep, en of ze kloppen met de spaarrekening. */
export function savings() {
	const last = lastBookingDate();
	const month = last?.slice(0, 7) ?? currentMonth();
	const hues = hueMap();
	const { uitgaven } = new Ledger(loadTree()).month(month);
	const end = monthEnd(month);
	const balanceDate = last && last < end ? last : end;
	const spaar = accounts().filter((a) => a.kind === 'spaar');
	const bank = spaar.reduce((s, a) => s + (accountBalance(a.id, balanceDate) ?? 0), 0);
	const groups = uitgaven.children
		.filter((g) => g.hasPot)
		.map((g) => {
			const pots: (ApiRow & { path: string; funding: string })[] = [];
			const walk = (n: NodeStats, path: string[]) => {
				if (n.isPot) pots.push({ ...row(n, 0, hues), path: path.join(' › '), funding: n.funding });
				n.children.forEach((c) => walk(c, n === g ? [] : [...path, n.name]));
			};
			walk(g, []);
			return { id: g.id, hue: hues.get(g.id) ?? 'accent', name: g.name, icon: g.icon, group: g.children.length > 0, total: g.pot, pots };
		});
	return {
		balanceDate,
		total: uitgaven.pot,
		hasSavings: spaar.length > 0,
		/** Spaarrekening min spaarpotten; 0 als alles klopt. */
		difference: spaar.length ? bank - uitgaven.potSpaar : 0,
		savingsAccount: spaar[0]?.id ?? null,
		groups
	};
}

function find(n: NodeStats, id: number): NodeStats | null {
	if (n.id === id) return n;
	for (const c of n.children) {
		const hit = find(c, id);
		if (hit) return hit;
	}
	return null;
}

/** Detail van een budget, spaarpot of groep in één maand, met een jaar geschiedenis. */
export function budget(id: number, monthParam: string | null) {
	const tree = loadTree();
	const node = tree.byId.get(id);
	if (!node) return null;
	const hues = hueMap();
	const ledger = new Ledger(tree);
	const month = defaultMonth(monthParam);
	const root = (m: string) => (node.tree === 'inkomsten' ? ledger.month(m).inkomsten : ledger.month(m).uitgaven);
	const first = (db.prepare('SELECT MIN(booking_date) AS d FROM transactions').get() as { d: string | null }).d?.slice(0, 7) ?? month;
	const history: { month: string; spent: number; plan: number; balance: number | null }[] = [];
	for (let m = shiftMonth(month, -11) > first ? shiftMonth(month, -11) : first; m <= month; m = shiftMonth(m, 1)) {
		const f = figures(find(root(m), id)!);
		history.push({ month: m, spent: f.spent, plan: f.plan ?? 0, balance: f.balance });
	}
	const stats = find(root(month), id)!;
	const f = figures(stats);
	const ids = subtreeIds(node);
	const bookings = db
		.prepare(
			`SELECT t.id, t.booking_date AS date, COALESCE(t.counterparty, t.description) AS name, t.transfer_account_id IS NOT NULL AS transfer,
			 s.amount_cents AS amount, c.name AS budget
			 FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN categories c ON c.id = s.category_id
			 WHERE t.excluded = 0 AND s.category_id IN (${ids.join(',')}) AND substr(t.booking_date, 1, 7) = ?
			 ORDER BY t.booking_date DESC, t.id DESC`
		)
		.all(month) as { id: number; date: string; name: string; transfer: number; amount: number; budget: string }[];
	return {
		month,
		months: months(),
		node: {
			id,
			hue: hues.get(id) ?? 'accent',
			name: node.name,
			path: node.path,
			icon: node.effIcon,
			tree: node.tree,
			group: isGroup(node),
			kind: node.children.length ? 'groep' : kindOf(node),
			funding: node.effFunding
		},
		// Alles wat de editor in de app nodig heeft; los van wat getoond wordt (het icoon is hier het eigen icoon).
		edit: {
			parentId: node.parent_id,
			ownIcon: node.icon,
			ownColor: node.color,
			funding: node.funding,
			goalCents: node.goal_cents,
			goalDate: node.goal_date,
			bookings: (db.prepare('SELECT COUNT(*) AS n FROM splits WHERE category_id = ?').get(id) as { n: number }).n,
			childCount: node.children.length,
			/** Het maandbedrag dat nu geldt, met of het een afwijking is van het standaardbedrag. */
			amount: isGroup(node) ? null : ledger.budgets.amount(id, month),
			template: isGroup(node) ? null : ledger.budgets.template(id, month),
			override: isGroup(node) ? null : ledger.budgets.override(id, month)
		},
		figures: { ...f, inleg: stats.inlegActual, outside: -stats.outside, toWithdraw: stats.toWithdraw },
		goal: stats.goal,
		history,
		bookings: bookings.map((b) => ({ ...b, transfer: !!b.transfer })),
		children: node.children.length ? rowsUnder(stats).map((r) => row(r.node, r.level, hues)) : []
	};
}

/** Groepen (uitgaven) en de plek voor inkomsten, voor het kiezen van een groep in de editor. */
export function groupChoices() {
	const tree = loadTree();
	const item = (n: { id: number; name: string; effIcon: string | null }) => ({ id: n.id, name: n.name, icon: n.effIcon });
	return { groups: tree.roots.uitgaven.children.map(item), incomeRoot: tree.roots.inkomsten.id };
}

/** Groepen met hun budgetten en de inkomstenbronnen, in de volgorde van de website, om te ordenen. */
export function ordering() {
	const tree = loadTree();
	const hues = hueMap();
	const item = (n: { id: number; name: string; effIcon: string | null }) => ({ id: n.id, name: n.name, icon: n.effIcon, hue: hues.get(n.id) ?? 'accent' });
	return {
		expensesRoot: tree.roots.uitgaven.id,
		incomeRoot: tree.roots.inkomsten.id,
		groups: tree.roots.uitgaven.children.map((g) => ({ ...item(g), budgets: g.children.map(item) })),
		income: tree.roots.inkomsten.children.map(item)
	};
}
