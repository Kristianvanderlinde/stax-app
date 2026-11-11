import { db } from './db';
import { fullName, isGroup, isSavingsPot, loadTree, subtreeIds } from './categories';
import { autoCategorize, isWithdrawal, learnRule, needsPot, setSplits } from './categorize';
import { Ledger, currentMonth, isOpenSql, lastBookingDate, savingsTargets } from './reports';
import { REFUND_OPEN, openRefunds, setExpected, syncRefunds } from './refunds';
import type { Split } from '$lib/types';

// Boekingen ophalen en indelen. Gedeeld door de website (Boekingen) en de API voor de iOS-app.

export type Status = 'open' | 'ingedeeld' | 'overboeking' | 'uitgesloten';

/** De uitgave waar een teruggave bij hoort. */
export interface RefundSource {
	id: number;
	date: string;
	amount: number;
	name: string;
}

export interface Row {
	id: number;
	account_id: number;
	account_kind: 'betaal' | 'spaar';
	booking_date: string;
	amount_cents: number;
	counterparty: string | null;
	counterparty_iban: string | null;
	description: string;
	raw_info: string;
	transfer_account_id: number | null;
	excluded: number;
	note: string | null;
	/** Bij een uitgave: hoeveel je terugverwacht, en hoeveel daarvan al binnen is. */
	refund_expected: number | null;
	refund_received: number;
	/** Bij een teruggave: de uitgave waar hij bij hoort. */
	refund_source: RefundSource | null;
	splits: Split[];
	status: Status;
	needsPot: boolean;
	/** Van de spaarrekening naar de betaalrekening; de pot waar het uit komt gaat omlaag. */
	withdrawal: boolean;
}

/** Boekingen met hun indeling en status, nieuwste eerst. */
export function queryRows(where: string[], params: (string | number)[]): Row[] {
	const rows = db
		.prepare(
			`SELECT t.id, t.account_id, a.kind AS account_kind, t.booking_date, t.amount_cents, t.counterparty, t.counterparty_iban,
			 t.description, t.raw_info, t.transfer_account_id, t.excluded, t.note, t.refund_expected,
			 (SELECT COALESCE(SUM(r.amount_cents), 0) FROM transactions r WHERE r.refund_of = t.id) AS refund_received,
			 (SELECT json_object('id', e.id, 'date', e.booking_date, 'amount', e.amount_cents, 'name', COALESCE(e.counterparty, e.description))
			  FROM transactions e WHERE e.id = t.refund_of) AS refund_source,
			 (SELECT json_group_array(json_object('category_id', category_id, 'amount_cents', amount_cents, 'source', source, 'from_pot', from_pot)) FROM splits WHERE transaction_id = t.id) AS splits,
			 ${isOpenSql()} AS is_open
			 FROM transactions t JOIN accounts a ON a.id = t.account_id
			 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			 ORDER BY t.booking_date DESC, t.id DESC LIMIT 600`
		)
		.all(...params) as (Omit<Row, 'splits' | 'status' | 'needsPot' | 'withdrawal' | 'refund_source'> & { splits: string; refund_source: string | null; is_open: number })[];

	return rows.map((r) => {
		const splits = JSON.parse(r.splits) as Split[];
		const pot = needsPot(r);
		const withdrawal = isWithdrawal(r);
		const status: Status = r.excluded
			? 'uitgesloten'
			: r.is_open
				? 'open'
				: r.transfer_account_id != null && !pot
					? 'overboeking'
					: 'ingedeeld';
		return { ...r, splits, status, needsPot: pot, withdrawal, refund_source: r.refund_source ? (JSON.parse(r.refund_source) as RefundSource) : null };
	});
}

export interface BookingFilters {
	status: string;
	q: string;
	account: number | null;
	cat: number | null;
	van: string | null;
	/** 'alle' = alle maanden; leeg = de laatste maand (of alle bij zoeken en de filters hieronder). */
	month: string | null;
}

export function filtersFrom(params: URLSearchParams): BookingFilters {
	return {
		status: params.get('status') ?? 'alle',
		q: params.get('q')?.trim() ?? '',
		account: Number(params.get('rekening')) || null,
		cat: Number(params.get('map')) || null,
		van: params.get('van')?.trim() || null,
		month: params.get('maand')
	};
}

/** Boekingen met filters, plus wat het indeelvenster nodig heeft. */
export function listBookings(f: BookingFilters) {
	const tree = loadTree();
	const { status, q, account, cat, van } = f;
	// Bij zoeken, filteren op tegenpartij, 'nog indelen' of 'terug verwacht' kijken we over alle maanden heen.
	// 'alle' = bewust alle maanden; zonder maand in het adres tonen we de laatste maand.
	const chosen = f.month;
	const month = chosen === 'alle' ? null : (chosen ?? (q || van || status === 'open' || status === 'terug' ? null : (lastBookingDate()?.slice(0, 7) ?? currentMonth())));

	const where: string[] = [];
	const params: (string | number)[] = [];
	if (month) {
		where.push('substr(t.booking_date, 1, 7) = ?');
		params.push(month);
	}
	if (account) {
		where.push('t.account_id = ?');
		params.push(account);
	}
	if (q) {
		where.push("(t.counterparty LIKE ? OR t.description LIKE ? OR t.raw_info LIKE ? OR replace(printf('%.2f', abs(t.amount_cents) / 100.0), '.', ',') LIKE ?)");
		params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q.replace('.', ',')}%`);
	}
	if (van) {
		where.push('t.counterparty = ?');
		params.push(van);
	}
	if (status === 'open') where.push(isOpenSql(tree));
	if (status === 'terug') where.push(REFUND_OPEN);
	if (cat && tree.byId.has(cat)) {
		const ids = subtreeIds(tree.byId.get(cat)!);
		where.push(`EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id AND s.category_id IN (${ids.join(',')}))`);
	}

	const list = queryRows(where, params);

	const months = (db.prepare("SELECT DISTINCT substr(booking_date, 1, 7) AS m FROM transactions ORDER BY m DESC").all() as { m: string }[]).map((r) => r.m);

	// Potten waarvoor nog geld van de spaarrekening moet komen; bij een opname stellen we die voor.
	const ledger = new Ledger(tree);
	const now = lastBookingDate()?.slice(0, 7) ?? currentMonth();
	const toWithdraw = tree.flat
		.filter(isSavingsPot)
		.map((n) => ({ id: n.id, name: fullName(n), cents: ledger.ownToWithdraw(n, now) }))
		.filter((p) => p.cents > 0);

	return {
		tree,
		rows: list,
		toWithdraw,
		// Inkomsten op de spaarrekening mogen bij inkomsten; het geld gaat dan naar deze pot.
		incomePot: ledger.incomePot ? fullName(tree.byId.get(ledger.incomePot)!) : null,
		months,
		refunds: openRefunds(),
		filters: { status, q, account, cat, month, van }
	};
}

/**
 * Deelt boekingen in zijn geheel in bij één map. Een boeking op de spaarrekening kan alleen in een
 * spaarpot, en de betaalkant van een overboeking hoeft niet ingedeeld; die worden overgeslagen.
 */
export function assign(ids: number[], categoryId: number | null): number {
	const tree = loadTree();
	const cat = categoryId != null ? tree.byId.get(categoryId) : undefined;
	if (categoryId != null && (!cat || isGroup(cat))) return 0;
	const rows = queryRows([`t.id IN (${ids.join(',')})`], []);
	const allowed = new Set(savingsTargets(tree));
	let n = 0;
	for (const r of rows) {
		if (r.status === 'overboeking') continue;
		if (cat && r.needsPot && !allowed.has(cat.id)) continue;
		setSplits(r.id, cat ? [{ category_id: cat.id, amount_cents: r.amount_cents }] : []);
		n++;
	}
	syncRefunds(rows.map((r) => r.id));
	return n;
}

export interface Classification {
	splits: Split[];
	/** 0 = van de lopende rekening, niet uit de pot. */
	fromPot: 0 | 1;
	note: string;
	excluded: boolean;
	/** Bij een uitgave: hoeveel je terugverwacht (null = niets). */
	refund: number | null;
	/** Een regel leren zodat vergelijkbare boekingen volgen. */
	remember: boolean;
}

/** Eén boeking indelen. Geeft een foutmelding, of hoeveel andere boekingen een nieuwe regel meteen indeelde. */
export function classify(id: number, c: Classification): { error: string; status: number } | { applied: number } {
	const t = db.prepare('SELECT t.amount_cents, a.kind FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = ?').get(id) as
		| { amount_cents: number; kind: 'betaal' | 'spaar' }
		| undefined;
	if (!t) return { error: 'Boeking niet gevonden.', status: 404 };
	const splits = c.splits.filter((s) => s.category_id && s.amount_cents);
	const total = splits.reduce((s, x) => s + x.amount_cents, 0);
	if (splits.length && total !== t.amount_cents) return { error: 'De delen tellen niet op tot het bedrag van de boeking.', status: 400 };
	const tree = loadTree();
	if (splits.some((x) => !tree.byId.has(x.category_id) || isGroup(tree.byId.get(x.category_id)!)))
		return { error: 'Kies een budget, geen groep.', status: 400 };
	if (t.kind === 'spaar') {
		const allowed = new Set(savingsTargets(tree));
		if (splits.some((x) => !allowed.has(x.category_id))) return { error: 'Op de spaarrekening hoort elke boeking bij een budget dat spaart, of bij inkomsten.', status: 400 };
	}
	if (t.amount_cents < 0 && c.refund !== null && !(c.refund > 0)) return { error: 'Vul in hoeveel je terugverwacht.', status: 400 };

	setSplits(id, splits.map((s) => ({ ...s, source: 'hand', from_pot: c.fromPot })));
	db.prepare('UPDATE transactions SET note = ?, excluded = ? WHERE id = ?').run(c.note.trim() || null, c.excluded ? 1 : 0, id);
	if (t.amount_cents < 0) {
		setExpected(id, c.refund ? Math.abs(c.refund) : null);
		syncRefunds([id]);
	}
	const applied = c.remember && splits.length === 1 && learnRule(id, splits[0].category_id) ? autoCategorize() : 0;
	return { applied };
}
