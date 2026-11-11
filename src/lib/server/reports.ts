import { db, getSetting } from './db';
import { holdsSavings, isGroup, isSavingsPot, loadTree, type CategoryTree } from './categories';
import { Budgets } from './budgets';
import { goalMonthOf, shiftMonth } from '$lib/months';
import { money as euro } from '$lib/format';
import type { CatNode, GoalStats, NodeStats } from '$lib/types';

export type { NodeStats };

/** SQL: moet deze boeking ingedeeld worden? Alles behalve de betaalkant van een overboeking: op de spaarrekening hoort elke boeking bij een pot. */
export const NEEDS_SPLIT = `(t.transfer_account_id IS NULL OR a.kind = 'spaar')`;

/**
 * De spaarpot waar inkomsten op de spaarrekening (zoals rente) in terechtkomen. Zo kun je rente bij
 * inkomsten zetten en kloppen de potten toch met de bank. Standaard Vrij sparen, als die bestaat.
 */
export function incomePotId(tree: CategoryTree): number | null {
	const set = getSetting('inkomstenpot');
	const n = set === null ? tree.flat.find((c) => holdsSavings(c) && c.name.toLowerCase() === 'vrij sparen') : tree.byId.get(Number(set));
	return n && holdsSavings(n) ? n.id : null;
}

/** Mappen waar een boeking op de spaarrekening bij mag: spaargeld, en inkomsten als er een pot voor is. */
export function savingsTargets(tree: CategoryTree): number[] {
	const income = incomePotId(tree) != null;
	return tree.flat.filter((n) => holdsSavings(n) || (income && n.tree === 'inkomsten' && !isGroup(n))).map((n) => n.id);
}

/**
 * SQL: boeking die nog (deels) ingedeeld moet worden. Op de spaarrekening ook als een deel bij een map
 * staat die geen spaargeld kan bevatten, anders kloppen de potten niet meer met de bank.
 */
export function isOpenSql(tree: CategoryTree = loadTree()): string {
	const holders = savingsTargets(tree);
	return `(t.excluded = 0 AND ${NEEDS_SPLIT} AND (COALESCE((SELECT SUM(amount_cents) FROM splits WHERE transaction_id = t.id), 0) != t.amount_cents
		OR (a.kind = 'spaar' AND EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id AND s.category_id NOT IN (${holders.join(',') || '0'})))))`;
}

export function monthEnd(month: string): string {
	const [y, m] = month.split('-').map(Number);
	return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export { shiftMonth };

export function currentMonth(): string {
	return new Date().toISOString().slice(0, 7);
}

/** Saldo van een rekening aan het eind van een dag, terugrekenend vanaf het recentste afschrift. */
export function accountBalance(accountId: number, date: string): number | null {
	const st = db
		.prepare('SELECT closing_cents, closing_date FROM statements WHERE account_id = ? AND closing_cents IS NOT NULL ORDER BY closing_date DESC, id DESC LIMIT 1')
		.get(accountId) as { closing_cents: number; closing_date: string } | undefined;
	if (!st) return null;
	const after = db
		.prepare('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM transactions WHERE account_id = ? AND booking_date > ? AND booking_date <= ?')
		.get(accountId, date, st.closing_date) as { s: number };
	return st.closing_cents - after.s;
}

export function accounts() {
	return db.prepare('SELECT id, iban, name, kind FROM accounts ORDER BY kind, name').all() as {
		id: number;
		iban: string;
		name: string;
		kind: 'betaal' | 'spaar';
	}[];
}

export function lastBookingDate(): string | null {
	return (db.prepare('SELECT MAX(booking_date) AS d FROM transactions').get() as { d: string | null }).d;
}

/** Vanaf deze datum tellen potsaldi; daarvoor geldt het startsaldo per pot. */
function potFromDate(): string {
	const start = getSetting('startdatum');
	if (start) return start;
	return (db.prepare('SELECT MIN(booking_date) AS d FROM transactions').get() as { d: string | null }).d ?? `${currentMonth()}-01`;
}

function monthsBetween(from: string, to: string): number {
	const [y1, m1] = from.split('-').map(Number);
	const [y2, m2] = to.split('-').map(Number);
	return (y2 - y1) * 12 + (m2 - m1);
}

/**
 * Bedragen per map per maand. inleg = stortingen op de spaarrekening, opname = geld dat eraf ging,
 * direct = andere boekingen op de spaarrekening (zoals rente), uitPot = uitgaven van de betaalrekening
 * die uit een spaarpot moeten komen en dus nog van de spaarrekening opgenomen moeten worden.
 */
type Sums = { flow: number; inleg: number; outside: number; opname: number; direct: number; uitPot: number };
type MonthSums = Map<number, Map<string, Sums>>;
const ZERO: Sums = { flow: 0, inleg: 0, outside: 0, opname: 0, direct: 0, uitPot: 0 };
const KEYS = Object.keys(ZERO) as (keyof Sums)[];

/** Alle ingedeelde bedragen per map per maand, eenmalig opgehaald. */
function loadLedger(potFrom: string) {
	const rows = db
		.prepare(
			`SELECT s.category_id AS id, substr(t.booking_date, 1, 7) AS m, t.booking_date >= ? AS in_pot,
			 SUM(CASE WHEN t.transfer_account_id IS NULL THEN s.amount_cents ELSE 0 END) AS flow,
			 SUM(CASE WHEN t.transfer_account_id IS NOT NULL AND t.amount_cents > 0 THEN s.amount_cents ELSE 0 END) AS inleg,
			 SUM(CASE WHEN t.transfer_account_id IS NOT NULL AND t.amount_cents < 0 THEN s.amount_cents ELSE 0 END) AS opname,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND s.from_pot = 0 THEN s.amount_cents ELSE 0 END) AS outside,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND a.kind = 'spaar' THEN s.amount_cents ELSE 0 END) AS direct,
			 SUM(CASE WHEN t.transfer_account_id IS NULL AND a.kind = 'betaal' AND s.from_pot = 1 THEN s.amount_cents ELSE 0 END) AS uitPot
			 FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN accounts a ON a.id = t.account_id
			 WHERE t.excluded = 0
			 GROUP BY s.category_id, m, in_pot`
		)
		.all(potFrom) as unknown as ({ id: number; m: string; in_pot: number } & Sums)[];
	const all: MonthSums = new Map();
	const pot: MonthSums = new Map();
	for (const r of rows) {
		for (const target of r.in_pot ? [all, pot] : [all]) {
			if (!target.has(r.id)) target.set(r.id, new Map());
			const cur = target.get(r.id)!.get(r.m) ?? ZERO;
			target.get(r.id)!.set(r.m, Object.fromEntries(KEYS.map((k) => [k, cur[k] + r[k]])) as Sums);
		}
	}
	return { all, pot };
}

export class Ledger {
	readonly potFrom: string;
	readonly potFromMonth: string;
	private sums: ReturnType<typeof loadLedger>;

	readonly budgets = new Budgets();
	readonly incomePot: number | null;
	private incomeIds: number[];

	constructor(readonly tree: CategoryTree = loadTree()) {
		this.potFrom = potFromDate();
		this.potFromMonth = this.potFrom.slice(0, 7);
		this.sums = loadLedger(this.potFrom);
		this.incomePot = incomePotId(tree);
		this.incomeIds = tree.flat.filter((n) => n.tree === 'inkomsten').map((n) => n.id);
	}

	/** Alle potbedragen van een map vanaf de startdatum tot en met een maand, opgeteld. */
	private potSums(n: CatNode, month: string): Sums {
		const total = { ...ZERO };
		if (month < this.potFromMonth) return total;
		for (const [m, v] of this.sums.pot.get(n.id) ?? []) if (m <= month) for (const k of KEYS) total[k] += v[k];
		// Inkomsten op de spaarrekening (rente) komen in de inkomstenpot.
		if (n.id === this.incomePot)
			for (const id of this.incomeIds) for (const [m, v] of this.sums.pot.get(id) ?? []) if (m <= month) total.direct += v.direct;
		return total;
	}

	private isPot(n: CatNode) {
		return n.tree === 'uitgaven' && !isGroup(n) && n.effective === 'pot';
	}

	/** Eerste maand waarin een maandbedrag van deze pot meetelt. */
	private potStartMonth(n: CatNode) {
		return n.start_month && n.start_month > this.potFromMonth ? n.start_month : this.potFromMonth;
	}

	/**
	 * Eigen saldo van een pot (zonder submappen) aan het eind van een maand.
	 * Spaargeld telt alleen wat er echt op de spaarrekening gebeurde: stortingen, opnames en rente.
	 * Zo tellen de potten altijd op tot het saldo van de spaarrekening.
	 */
	ownPotBalance(n: CatNode, month: string): number {
		if (holdsSavings(n)) {
			const v = this.potSums(n, month);
			return n.opening_cents + v.inleg + v.opname + v.direct;
		}
		if (!this.isPot(n) || month < this.potFromMonth) return this.isPot(n) ? n.opening_cents : 0;
		// Een pot op de betaalrekening: uitgaven die van de lopende rekening kwamen (niet uit de pot) laten het saldo staan.
		const v = this.potSums(n, month);
		let total = n.opening_cents + v.flow - v.outside + v.inleg + v.opname;
		// Hij krijgt zijn maandbedrag vanzelf; er gaat geen overboeking aan vooraf.
		for (let m = this.potFromMonth; m <= month; m = shiftMonth(m, 1)) total += this.budgets.amount(n.id, m) ?? 0;
		return total;
	}

	/**
	 * Wat er nog van de spaarrekening opgenomen moet worden voor deze pot: uitgaven van de betaalrekening
	 * die uit de pot komen, min wat er al aan opnames aan de pot gekoppeld is.
	 */
	ownToWithdraw(n: CatNode, month: string): number {
		if (!isSavingsPot(n)) return 0;
		const v = this.potSums(n, month);
		return Math.max(0, v.opname - v.uitPot);
	}

	/** Saldo van een pot inclusief alle potten eronder. */
	potBalance(n: CatNode, month: string): number {
		return this.ownPotBalance(n, month) + n.children.reduce((s, c) => s + this.potBalance(c, month), 0);
	}

	private ownMonth(n: CatNode, month: string) {
		return this.sums.all.get(n.id)?.get(month) ?? ZERO;
	}

	private ownInlegActual(n: CatNode, month: string): number {
		if (!this.isPot(n)) return 0;
		if (n.effFunding === 'betaal') return month >= this.potFromMonth ? (this.budgets.amount(n.id, month) ?? 0) : 0;
		return this.ownMonth(n, month).inleg;
	}

	private goal(n: CatNode, balance: number, month: string): GoalStats | null {
		if (!n.goal_cents) return null;
		const target = n.goal_cents;
		const g: GoalStats = { target, date: n.goal_date, progress: target > 0 ? balance / target : 0, expected: null, perMonth: null, monthsLeft: null };
		if (n.goal_date) {
			const goalMonth = goalMonthOf(n.goal_date);
			const start = this.potStartMonth(n);
			const total = Math.max(1, monthsBetween(start, goalMonth) + 1);
			const elapsed = Math.min(total, Math.max(0, monthsBetween(start, month) + 1));
			g.expected = Math.round(n.opening_cents + ((target - n.opening_cents) * elapsed) / total);
			g.monthsLeft = Math.max(0, monthsBetween(month, goalMonth));
			g.perMonth = g.monthsLeft > 0 ? Math.max(0, Math.ceil((target - balance) / g.monthsLeft)) : Math.max(0, target - balance);
		}
		return g;
	}

	/** Cijfers voor één maand, als boom. */
	month(month: string): { uitgaven: NodeStats; inkomsten: NodeStats } {
		const build = (n: CatNode): NodeStats => {
			const children = n.children.map(build);
			const own = this.ownMonth(n, month);
			const isPot = this.isPot(n);
			const ownPot = this.ownPotBalance(n, month);
			const monthly = this.budgets.amount(n.id, month);
			const stats: NodeStats = {
				id: n.id,
				name: n.name,
				tree: n.tree,
				depth: n.depth,
				path: n.path,
				effective: n.effective,
				funding: n.effFunding,
				icon: n.effIcon,
				monthly,
				budgetTemplate: this.budgets.template(n.id, month)?.amount ?? null,
				budgetOverride: this.budgets.override(n.id, month) !== null,
				flow: own.flow + children.reduce((s, c) => s + c.flow, 0),
				ownFlow: own.flow,
				outside: own.outside + children.reduce((s, c) => s + c.outside, 0),
				ownPot: ownPot,
				ownInleg: this.ownInlegActual(n, month),
				isPot,
				pot: ownPot + children.reduce((s, c) => s + c.pot, 0),
				potSpaar: (isPot && n.effFunding === 'spaar' ? ownPot : 0) + children.reduce((s, c) => s + c.potSpaar, 0),
				inlegPlanned: (isPot ? (monthly ?? 0) : 0) + children.reduce((s, c) => s + c.inlegPlanned, 0),
				inlegActual: this.ownInlegActual(n, month) + children.reduce((s, c) => s + c.inlegActual, 0),
				toWithdraw: this.ownToWithdraw(n, month) + children.reduce((s, c) => s + c.toWithdraw, 0),
				hasPot: isPot || children.some((c) => c.hasPot),
				available: null,
				goal: null,
				children
			};
			if (n.effective === 'budget' && monthly) stats.available = monthly + stats.flow;
			if (isPot) stats.goal = this.goal(n, stats.pot, month);
			return stats;
		};
		return { uitgaven: build(this.tree.roots.uitgaven), inkomsten: build(this.tree.roots.inkomsten) };
	}

	/** Potsaldo aan het eind van elke maand, voor een grafiek. */
	potSeries(n: CatNode, months: string[]) {
		return months.map((m) => ({ month: m, balance: this.potBalance(n, m) }));
	}
}

export function openCounts(month: string) {
	return db
		.prepare(
			`SELECT COUNT(*) AS n,
			 COALESCE(SUM(CASE WHEN t.amount_cents < 0 THEN t.amount_cents END), 0) AS uit,
			 COALESCE(SUM(CASE WHEN t.amount_cents > 0 THEN t.amount_cents END), 0) AS bij
			 FROM transactions t JOIN accounts a ON a.id = t.account_id
			 WHERE ${isOpenSql()} AND substr(t.booking_date, 1, 7) = ?`
		)
		.get(month) as { n: number; uit: number; bij: number };
}

/** Totaal gebudgetteerd in een maand: alle budgetten plus de geplande inleg van potten. */
export function plannedTotal(root: NodeStats): number {
	let sum = 0;
	const walk = (n: NodeStats) => {
		if (n.effective === 'budget' && n.monthly) sum += n.monthly;
		n.children.forEach(walk);
	};
	walk(root);
	return sum + root.inlegPlanned;
}

export interface MonthRow {
	node: NodeStats;
	/** Inspringing: 0 direct onder de groep, 1 daaronder, enzovoort. */
	level: number;
	/** Map met submappen; de rij toont het totaal van de rijen eronder. */
	parent: boolean;
}

/**
 * Alle budgetten onder een map als ingesprongen boom. Een groep krijgt een totaalrij met zijn budgetten eronder.
 * Een groep heeft zelf geen boekingen of budget; een budget dat "Algemeen" heet is gewoon een budget.
 */
export function rowsUnder(node: NodeStats): MonthRow[] {
	const rows: MonthRow[] = [];
	const walk = (n: NodeStats, level: number) => {
		rows.push({ node: n, level, parent: n.children.length > 0 });
		n.children.forEach((c) => walk(c, level + 1));
	};
	node.children.forEach((c) => walk(c, 0));
	return rows;
}

/** Alle mappen als rijen voor de maandweergave, gegroepeerd per hoofdmap. */
export function monthRows(root: NodeStats) {
	return root.children.map((group) => ({ group, rows: rowsUnder(group) })).filter((g) => g.rows.length > 0);
}

export interface IncomeSummary {
	/** Verwacht inkomen deze maand: de bedragen die bij de inkomsten zijn ingevuld. */
	expected: number;
	/** Wat er volgens de boekingen echt binnenkwam. */
	received: number;
	/** Waar "nog te verdelen" mee rekent: het verwachte inkomen, of het ontvangen als er niets verwacht is. */
	base: number;
	/** Korte uitleg hoe ontvangen zich verhoudt tot verwacht, of null als er niets verwacht is. */
	note: string | null;
}

/** Verwacht tegenover ontvangen inkomen, zodat je aan het begin van de maand kunt plannen en aan het eind kunt vergelijken. */
export function incomeSummary(inkomsten: NodeStats, month: string): IncomeSummary {
	let expected = 0;
	const walk = (n: NodeStats) => {
		expected += n.monthly ?? 0;
		n.children.forEach(walk);
	};
	walk(inkomsten);
	const received = inkomsten.flow;
	const base = expected > 0 ? expected : received;
	if (expected <= 0) return { expected, received, base, note: null };
	const diff = received - expected;
	// Een maand is af als hij voorbij is, of als de boekingen tot de laatste dag lopen.
	const done = month < currentMonth() || (lastBookingDate() ?? '') >= monthEnd(month);
	const note =
		diff === 0
			? 'precies zoals verwacht ontvangen'
			: diff > 0
				? `${euro(diff)} meer ontvangen dan verwacht`
				: done
					? `${euro(-diff)} minder ontvangen dan verwacht`
					: `nog ${euro(-diff)} te ontvangen`;
	return { expected, received, base, note };
}
