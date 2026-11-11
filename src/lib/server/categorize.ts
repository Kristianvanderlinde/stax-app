import { db, tx } from './db';
import { isBudgetId, loadTree, matchPotByName, type CategoryTree } from './categories';
import { savingsTargets } from './reports';
import type { Split, Transaction } from '$lib/types';

interface Rule {
	id: number;
	field: 'iban' | 'tegenpartij' | 'omschrijving' | 'mcc';
	op: 'is' | 'bevat';
	pattern: string;
	category_id: number;
}

interface TxRow extends Transaction {
	account_kind: 'betaal' | 'spaar';
}

const FIELD_ORDER = ['iban', 'tegenpartij', 'omschrijving', 'mcc'];

/**
 * Elke boeking op de spaarrekening hoort bij een spaarpot: inleg, opnames en rente. Zo tellen de potten
 * altijd op tot het saldo. De betaalkant van een overboeking hoeft niet ingedeeld.
 */
export function needsPot(t: { transfer_account_id: number | null; account_kind: string; amount_cents: number }) {
	return t.account_kind === 'spaar';
}

/** Geld van de spaarrekening naar de betaalrekening: de pot waar het uit komt gaat omlaag. */
export function isWithdrawal(t: { transfer_account_id: number | null; account_kind: string; amount_cents: number }) {
	return t.transfer_account_id != null && t.account_kind === 'spaar' && t.amount_cents < 0;
}

export function isInternal(t: { transfer_account_id: number | null; account_kind: string; amount_cents: number }) {
	return t.transfer_account_id != null && !needsPot(t);
}

function loadRules(): Rule[] {
	const rules = db.prepare('SELECT id, field, op, pattern, category_id FROM rules').all() as unknown as Rule[];
	// Specifiek vóór algemeen: eerst op veld, dan 'is' vóór 'bevat', dan het langste patroon.
	return rules.sort(
		(a, b) =>
			FIELD_ORDER.indexOf(a.field) - FIELD_ORDER.indexOf(b.field) ||
			(a.op === 'is' ? 0 : 1) - (b.op === 'is' ? 0 : 1) ||
			b.pattern.length - a.pattern.length
	);
}

function value(t: Transaction, field: Rule['field']): string {
	switch (field) {
		case 'iban':
			return t.counterparty_iban ?? '';
		case 'tegenpartij':
			return (t.counterparty ?? '').toLowerCase();
		case 'omschrijving':
			return t.description.toLowerCase();
		case 'mcc':
			return t.mcc ?? '';
	}
}

function matches(rule: Rule, t: Transaction): boolean {
	const v = value(t, rule.field);
	if (!v) return false;
	const p = rule.field === 'iban' || rule.field === 'mcc' ? rule.pattern : rule.pattern.toLowerCase();
	return rule.op === 'is' ? v === p : v.includes(p);
}

function suggest(t: TxRow, rules: Rule[], tree: CategoryTree): { categoryId: number; source: 'regel' | 'naam' } | null {
	if (needsPot(t)) {
		// Op de spaarrekening is de tegenpartij meestal jullie eigen rekening; alleen de omschrijving zegt iets.
		const allowed = new Set(savingsTargets(tree));
		const rule = rules.find((r) => r.field === 'omschrijving' && matches(r, t) && allowed.has(r.category_id));
		if (rule) return { categoryId: rule.category_id, source: 'regel' };
		const pot = matchPotByName(tree, t.description);
		return pot ? { categoryId: pot.id, source: 'naam' } : null;
	}
	if (t.transfer_account_id != null) return null;
	const rule = rules.find((r) => matches(r, t) && isBudgetId(tree, r.category_id));
	return rule ? { categoryId: rule.category_id, source: 'regel' } : null;
}

/** Deelt alle boekingen zonder indeling in waar een regel of potnaam op past. Geeft het aantal terug. */
export function autoCategorize(): number {
	const rules = loadRules();
	const tree = loadTree();
	const open = db
		.prepare(
			`SELECT t.*, a.kind AS account_kind FROM transactions t JOIN accounts a ON a.id = t.account_id
			 WHERE t.excluded = 0 AND NOT EXISTS (SELECT 1 FROM splits s WHERE s.transaction_id = t.id)`
		)
		.all() as unknown as TxRow[];
	const insert = db.prepare('INSERT INTO splits (transaction_id, category_id, amount_cents, source) VALUES (?, ?, ?, ?)');
	let n = 0;
	tx(() => {
		for (const t of open) {
			const s = suggest(t, rules, tree);
			if (!s) continue;
			insert.run(t.id, s.categoryId, t.amount_cents, s.source);
			n++;
		}
	});
	return n;
}

/** Legt een regel vast op basis van een handmatige indeling, zodat vergelijkbare boekingen volgen. */
export function learnRule(transactionId: number, categoryId: number): boolean {
	const t = db
		.prepare('SELECT t.*, a.kind AS account_kind FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE t.id = ?')
		.get(transactionId) as unknown as TxRow | undefined;
	if (!t) return false;

	let field: Rule['field'];
	let pattern: string;
	if (needsPot(t) || !t.counterparty) {
		if (!t.description) return false;
		field = 'omschrijving';
		pattern = t.description;
	} else {
		field = 'tegenpartij';
		pattern = t.counterparty;
	}
	db.prepare(
		`INSERT INTO rules (field, op, pattern, category_id) VALUES (?, 'is', ?, ?)
		 ON CONFLICT(field, op, pattern) DO UPDATE SET category_id = excluded.category_id`
	).run(field, pattern.toLowerCase(), categoryId);
	return true;
}

export function setSplits(transactionId: number, splits: Split[]) {
	tx(() => {
		db.prepare('DELETE FROM splits WHERE transaction_id = ?').run(transactionId);
		const insert = db.prepare('INSERT INTO splits (transaction_id, category_id, amount_cents, source, from_pot) VALUES (?, ?, ?, ?, ?)');
		for (const s of splits) insert.run(transactionId, s.category_id, s.amount_cents, s.source ?? 'hand', s.from_pot === 0 ? 0 : 1);
	});
}
