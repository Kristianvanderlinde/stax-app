import { db, tx } from './db';

// Back-up: al je gegevens in één bestand (JSON), te maken en terug te zetten op de server én in de app.
// Alleen gegevens; geen gebruikers, sessies of telefoons. De back-up is overal hetzelfde, dus een back-up van de
// server kan in de app terug en andersom.

export const BACKUP_FORMAT = 'stax-backup';
/** Verhoog alleen als de opbouw van het bestand zelf verandert. */
export const BACKUP_VERSION = 1;

// Volgorde waarin teruggezet wordt (verwijzingen eerst); bij het wissen andersom.
const TABLES = ['accounts', 'imports', 'statements', 'categories', 'transactions', 'splits', 'rules', 'budgets', 'settings'] as const;

export class BackupError extends Error {}

type Row = Record<string, unknown>;

const schemaVersion = () => (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
const columns = (table: string) => (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((c) => c.name);

export interface Backup {
	format: typeof BACKUP_FORMAT;
	version: number;
	/** Versie van de database waaruit de back-up komt. */
	schema: number;
	created: string;
	tables: Record<string, Row[]>;
}

export function exportBackup(): Backup {
	const tables: Record<string, Row[]> = {};
	for (const t of TABLES) tables[t] = db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all() as Row[];
	return { format: BACKUP_FORMAT, version: BACKUP_VERSION, schema: schemaVersion(), created: new Date().toISOString(), tables };
}

export const backupFileName = () => `stax-backup-${new Date().toISOString().slice(0, 10)}.json`;

/** Controleert een bestand; geeft het terug of gooit een begrijpelijke fout. */
export function checkBackup(input: unknown): Backup {
	const b = input as Backup | null;
	if (!b || typeof b !== 'object' || b.format !== BACKUP_FORMAT || !b.tables || typeof b.tables !== 'object') throw new BackupError('Dit is geen Stax-back-up.');
	if (!Number.isInteger(b.version) || b.version > BACKUP_VERSION) throw new BackupError('Deze back-up komt van een nieuwere versie van Stax. Werk Stax eerst bij.');
	if (!Number.isInteger(b.schema) || b.schema > schemaVersion()) throw new BackupError('Deze back-up komt van een nieuwere versie van Stax. Werk Stax eerst bij.');
	for (const t of TABLES) if (!Array.isArray(b.tables[t])) throw new BackupError('De back-up is onvolledig.');
	return b;
}

export interface BackupSummary {
	accounts: number;
	transactions: number;
	budgets: number;
}

export function summarize(b: Backup): BackupSummary {
	return { accounts: b.tables.accounts.length, transactions: b.tables.transactions.length, budgets: b.tables.categories.filter((c) => c.parent_id != null).length };
}

/** Vervangt alle gegevens door die uit de back-up. Alles of niets: bij een fout blijft alles zoals het was. */
export function importBackup(input: unknown): BackupSummary {
	const b = checkBackup(input);
	tx(() => {
		// Verwijzingen mogen tijdelijk niet kloppen; aan het eind van de transactie moet alles weer sluiten.
		db.exec('PRAGMA defer_foreign_keys = ON');
		for (const t of [...TABLES].reverse()) db.exec(`DELETE FROM ${t}`);
		for (const t of TABLES) {
			const known = columns(t);
			for (const row of b.tables[t]) {
				if (!row || typeof row !== 'object') throw new BackupError('De back-up is beschadigd.');
				// Alleen kolommen die deze versie kent; ontbrekende kolommen krijgen hun standaardwaarde.
				const cols = Object.keys(row).filter((c) => known.includes(c));
				const values = cols.map((c) => {
					const v = (row as Row)[c];
					if (v === null || typeof v === 'number' || typeof v === 'string') return v;
					throw new BackupError('De back-up is beschadigd.');
				});
				db.prepare(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).run(...(values as (string | number | null)[]));
			}
		}
		if (db.prepare('PRAGMA foreign_key_check').all().length) throw new BackupError('De back-up is beschadigd: verwijzingen kloppen niet.');
		if (!db.prepare('SELECT 1 FROM categories WHERE parent_id IS NULL LIMIT 1').get()) throw new BackupError('De back-up bevat geen budgetten.');
	});
	return summarize(b);
}
