import { db, tx } from './db';
import { parseBankFile, type BankFileOptions } from './bankfile';
import { NeedsInput, type CsvPreview } from './csv';
import { autoCategorize } from './categorize';

export interface ImportResult {
	filename: string;
	account: string;
	total: number;
	added: number;
	error?: string;
	/** Een CSV waarvoor nog kolommen of de rekening gekozen moeten worden; stuur het bestand daarna opnieuw mee. */
	needs?: CsvPreview;
}

export type ImportFile = { name: string; content: string } & BankFileOptions;

function ensureAccount(iban: string): number {
	const row = db.prepare('SELECT id FROM accounts WHERE iban = ?').get(iban) as { id: number } | undefined;
	if (row) return row.id;
	return Number(db.prepare('INSERT INTO accounts (iban, name) VALUES (?, ?)').run(iban, `Rekening ${iban.slice(-4)}`).lastInsertRowid);
}

export function importFiles(files: ImportFile[]): { results: ImportResult[]; categorized: number } {
	const results: (ImportResult & { accountId?: number })[] = [];
	const newAccounts: number[] = [];

	for (const file of files) {
		let statements;
		try {
			statements = parseBankFile(file.content, { mapping: file.mapping, iban: file.iban });
		} catch (e) {
			if (e instanceof NeedsInput) {
				results.push({ filename: file.name, account: '', total: 0, added: 0, needs: e.preview });
				continue;
			}
			results.push({ filename: file.name, account: '', total: 0, added: 0, error: (e as Error).message });
			continue;
		}
		for (const st of statements) {
			tx(() => {
				const existed = db.prepare('SELECT 1 FROM accounts WHERE iban = ?').get(st.iban);
				const accountId = ensureAccount(st.iban);
				if (!existed) newAccounts.push(accountId);

				const importId = Number(
					db.prepare('INSERT INTO imports (filename, account_id, n_total, n_new) VALUES (?, ?, ?, 0)').run(file.name, accountId, st.entries.length).lastInsertRowid
				);
				db.prepare(
					'INSERT INTO statements (import_id, account_id, opening_cents, opening_date, closing_cents, closing_date) VALUES (?, ?, ?, ?, ?, ?)'
				).run(importId, accountId, st.openingCents, st.openingDate, st.closingCents, st.closingDate);

				// Overlappende exports zijn geen probleem: een boeking die er al is, wordt overgeslagen.
				const insert = db.prepare(
					`INSERT OR IGNORE INTO transactions
					 (account_id, import_id, bank_ref, booking_date, amount_cents, counterparty, counterparty_iban, description, raw_info, bank_code, mcc)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				);
				let added = 0;
				for (const e of st.entries) {
					const r = insert.run(accountId, importId, e.bankRef, e.bookingDate, e.amountCents, e.counterparty, e.counterpartyIban, e.description, e.rawInfo, e.bankCode, e.mcc);
					added += Number(r.changes);
				}
				db.prepare('UPDATE imports SET n_new = ? WHERE id = ?').run(added, importId);
				results.push({ filename: file.name, account: '', accountId, total: st.entries.length, added });
			});
		}
	}

	tx(() => {
		guessAccountKinds(newAccounts);
		linkTransfers();
	});
	// Namen pas na het herkennen van de rekeningsoort, zodat een nieuwe rekening meteen goed heet.
	const name = db.prepare('SELECT name FROM accounts WHERE id = ?');
	for (const r of results) if (r.accountId) r.account = (name.get(r.accountId) as { name: string }).name;
	return { results: results.map(({ accountId: _, ...r }) => r), categorized: autoCategorize() };
}

/**
 * Een nieuwe rekening zonder pinbetalingen, waarvan bijna alle boekingen van of naar één andere
 * eigen rekening gaan, is vrijwel zeker een spaarrekening. Aanpasbaar in Instellingen.
 */
function guessAccountKinds(accountIds: number[]) {
	for (const id of accountIds) {
		const s = db
			.prepare(
				`SELECT COUNT(*) AS n,
				 SUM(bank_code LIKE 'CCRD%') AS card,
				 (SELECT COUNT(*) FROM transactions WHERE account_id = ?1 GROUP BY counterparty_iban ORDER BY COUNT(*) DESC LIMIT 1) AS top
				 FROM transactions WHERE account_id = ?1`
			)
			.get(id) as { n: number; card: number; top: number };
		if (s.n > 0 && s.card === 0 && s.top / s.n >= 0.8) {
			db.prepare("UPDATE accounts SET kind = 'spaar', name = 'Spaarrekening' WHERE id = ?").run(id);
		} else if (s.card > 0) {
			db.prepare("UPDATE accounts SET name = 'Betaalrekening' WHERE id = ? AND name LIKE 'Rekening %'").run(id);
		}
	}
}

/** Markeert boekingen tussen eigen rekeningen en koppelt beide kanten aan elkaar. */
function linkTransfers() {
	db.exec(`
		UPDATE transactions SET transfer_account_id = (SELECT id FROM accounts WHERE iban = transactions.counterparty_iban)
		WHERE transfer_account_id IS NULL AND counterparty_iban IN (SELECT iban FROM accounts);
	`);
	const unpaired = db
		.prepare('SELECT id, account_id, transfer_account_id, amount_cents, booking_date FROM transactions WHERE transfer_account_id IS NOT NULL AND transfer_tx_id IS NULL')
		.all() as { id: number; account_id: number; transfer_account_id: number; amount_cents: number; booking_date: string }[];
	const find = db.prepare(
		`SELECT id FROM transactions WHERE account_id = ? AND transfer_account_id = ? AND amount_cents = ? AND transfer_tx_id IS NULL
		 AND abs(julianday(booking_date) - julianday(?)) <= 3 ORDER BY abs(julianday(booking_date) - julianday(?)) LIMIT 1`
	);
	const link = db.prepare('UPDATE transactions SET transfer_tx_id = ? WHERE id = ?');
	const linked = new Set<number>();
	for (const t of unpaired) {
		if (linked.has(t.id)) continue;
		const other = find.get(t.transfer_account_id, t.account_id, -t.amount_cents, t.booking_date, t.booking_date) as { id: number } | undefined;
		if (!other) continue;
		linked.add(other.id);
		link.run(other.id, t.id);
		link.run(t.id, other.id);
	}
	// Een overboeking die eerder (vóór de andere rekening bekend was) automatisch was ingedeeld, is geen uitgave.
	db.exec(`
		DELETE FROM splits WHERE source != 'hand' AND transaction_id IN (
			SELECT t.id FROM transactions t JOIN accounts a ON a.id = t.account_id
			WHERE t.transfer_account_id IS NOT NULL AND NOT (a.kind = 'spaar' AND t.amount_cents > 0)
		);
	`);
}
