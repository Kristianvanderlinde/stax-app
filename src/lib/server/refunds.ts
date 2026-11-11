import { db, tx } from './db';
import { setSplits } from './categorize';
import type { Split } from '$lib/types';

// Teruggaven: bij een uitgave aangeven dat je er (een deel van) terugkrijgt, en het geld dat
// binnenkomt daaraan koppelen. De teruggave krijgt dan dezelfde indeling als de uitgave, zodat
// het budget netto klopt.

export interface Expected {
	id: number;
	booking_date: string;
	amount_cents: number;
	name: string;
	note: string | null;
	expected: number;
	received: number;
}

const RECEIVED = '(SELECT COALESCE(SUM(r.amount_cents), 0) FROM transactions r WHERE r.refund_of = t.id)';
/** Uitgaven waarvoor nog geld terug moet komen. */
export const REFUND_OPEN = `(t.refund_expected IS NOT NULL AND t.refund_expected > ${RECEIVED})`;

export function openRefunds(): Expected[] {
	return db
		.prepare(
			`SELECT t.id, t.booking_date, t.amount_cents, COALESCE(t.counterparty, t.description) AS name, t.note,
			 t.refund_expected AS expected, ${RECEIVED} AS received
			 FROM transactions t WHERE ${REFUND_OPEN} ORDER BY t.booking_date DESC, t.id DESC`
		)
		.all() as unknown as Expected[];
}

/** Bedrag dat je terugverwacht instellen (in centen, positief), of null om het te laten vallen. */
export function setExpected(id: number, cents: number | null) {
	db.prepare('UPDATE transactions SET refund_expected = ? WHERE id = ? AND amount_cents < 0').run(cents && cents > 0 ? cents : null, id);
}

/** Niets meer verwachten: wat binnen is, is het. Zonder iets binnen vervalt de verwachting helemaal. */
export function closeExpected(id: number) {
	db.prepare(`UPDATE transactions AS t SET refund_expected = NULLIF(${RECEIVED}, 0) WHERE t.id = ?`).run(id);
}

/** Verdeelt het bedrag van de teruggave naar verhouding over de delen van de uitgave. */
function mirror(expense: Split[], amount: number): Split[] {
	const total = expense.reduce((s, x) => s + x.amount_cents, 0);
	if (!total) return [];
	const out = expense.map((s) => ({
		category_id: s.category_id,
		amount_cents: Math.round((amount * s.amount_cents) / total),
		source: 'hand',
		from_pot: s.from_pot
	}));
	// Afrondingsverschil op het grootste deel.
	const diff = amount - out.reduce((s, x) => s + x.amount_cents, 0);
	if (diff) out.reduce((a, b) => (Math.abs(b.amount_cents) > Math.abs(a.amount_cents) ? b : a)).amount_cents += diff;
	return out.filter((s) => s.amount_cents);
}

function splitsOf(id: number): Split[] {
	return db.prepare('SELECT category_id, amount_cents, from_pot FROM splits WHERE transaction_id = ?').all(id) as unknown as Split[];
}

/** Koppelt een binnenkomende boeking aan een uitgave en neemt de indeling over. */
export function link(refundId: number, expenseId: number): string | null {
	const r = db.prepare('SELECT amount_cents, transfer_account_id FROM transactions WHERE id = ?').get(refundId) as
		| { amount_cents: number; transfer_account_id: number | null }
		| undefined;
	const e = db.prepare('SELECT amount_cents FROM transactions WHERE id = ?').get(expenseId) as { amount_cents: number } | undefined;
	if (!r || !e) return 'Boeking niet gevonden.';
	if (r.amount_cents <= 0 || r.transfer_account_id != null) return 'Alleen geld dat binnenkomt kan een teruggave zijn.';
	if (e.amount_cents >= 0) return 'Een teruggave hoort bij een uitgave.';
	tx(() => {
		db.prepare('UPDATE transactions SET refund_of = ? WHERE id = ?').run(expenseId, refundId);
		// Was er nog niets verwacht, dan geldt de teruggave als wat je verwachtte.
		db.prepare('UPDATE transactions SET refund_expected = COALESCE(refund_expected, ?) WHERE id = ?').run(r.amount_cents, expenseId);
		const splits = mirror(splitsOf(expenseId), r.amount_cents);
		if (splits.length) setSplits(refundId, splits);
	});
	return null;
}

/** Ontkoppelen; de overgenomen indeling gaat mee weg, zodat de boeking weer ingedeeld moet worden. */
export function unlink(refundId: number) {
	tx(() => {
		const was = db.prepare('UPDATE transactions SET refund_of = NULL WHERE id = ? AND refund_of IS NOT NULL').run(refundId);
		if (was.changes) setSplits(refundId, []);
	});
}

/** Na een nieuwe indeling van een uitgave lopen de gekoppelde teruggaven mee. */
export function syncRefunds(expenseIds: number[]) {
	if (!expenseIds.length) return;
	const refunds = db
		.prepare(`SELECT id, amount_cents, refund_of FROM transactions WHERE refund_of IN (${expenseIds.join(',')})`)
		.all() as { id: number; amount_cents: number; refund_of: number }[];
	tx(() => {
		for (const r of refunds) {
			const splits = mirror(splitsOf(r.refund_of), r.amount_cents);
			if (splits.length) setSplits(r.id, splits);
		}
	});
}
