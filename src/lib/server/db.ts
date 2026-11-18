import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { seed } from './seed';
import { groupsOnly } from './migrate-groups';
import { twoLevels } from './migrate-levels';

export const DATA_DIR = resolve(process.env.STAX_DATA ?? 'data');

// Elke stap verhoogt user_version met één. Voeg alleen nieuwe stappen toe; wijzig nooit een bestaande.
const MIGRATIONS: (string | ((db: DatabaseSync) => void))[] = [
	`
	CREATE TABLE accounts (
		id INTEGER PRIMARY KEY,
		iban TEXT NOT NULL UNIQUE,
		name TEXT NOT NULL,
		kind TEXT NOT NULL DEFAULT 'betaal' CHECK (kind IN ('betaal', 'spaar'))
	);

	CREATE TABLE imports (
		id INTEGER PRIMARY KEY,
		filename TEXT NOT NULL,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		imported_at TEXT NOT NULL DEFAULT (datetime('now')),
		n_total INTEGER NOT NULL,
		n_new INTEGER NOT NULL
	);

	-- Begin- en eindsaldo uit elk afschrift; het recentste eindsaldo bepaalt het rekeningsaldo.
	CREATE TABLE statements (
		id INTEGER PRIMARY KEY,
		import_id INTEGER NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		opening_cents INTEGER,
		opening_date TEXT,
		closing_cents INTEGER,
		closing_date TEXT
	);

	CREATE TABLE transactions (
		id INTEGER PRIMARY KEY,
		account_id INTEGER NOT NULL REFERENCES accounts(id),
		import_id INTEGER REFERENCES imports(id),
		bank_ref TEXT NOT NULL,
		booking_date TEXT NOT NULL,
		amount_cents INTEGER NOT NULL,
		counterparty TEXT,
		counterparty_iban TEXT,
		description TEXT NOT NULL DEFAULT '',
		raw_info TEXT NOT NULL DEFAULT '',
		bank_code TEXT,
		mcc TEXT,
		transfer_account_id INTEGER REFERENCES accounts(id),
		transfer_tx_id INTEGER REFERENCES transactions(id),
		excluded INTEGER NOT NULL DEFAULT 0,
		note TEXT,
		UNIQUE (account_id, bank_ref)
	);
	CREATE INDEX transactions_date ON transactions(booking_date);

	-- tree: 'uitgaven' of 'inkomsten'. Elke boom heeft één wortel (parent_id NULL).
	-- behavior NULL = overnemen van de bovenliggende map.
	CREATE TABLE categories (
		id INTEGER PRIMARY KEY,
		parent_id INTEGER REFERENCES categories(id),
		tree TEXT NOT NULL CHECK (tree IN ('uitgaven', 'inkomsten')),
		name TEXT NOT NULL,
		behavior TEXT CHECK (behavior IN ('sparen', 'budget_reset', 'budget_mee', 'bijhouden')),
		monthly_cents INTEGER,
		opening_cents INTEGER NOT NULL DEFAULT 0,
		start_month TEXT,
		sort INTEGER NOT NULL DEFAULT 0,
		archived INTEGER NOT NULL DEFAULT 0
	);

	-- Een boeking is ingedeeld via één of meer splitsingen; samen tellen ze op tot het bedrag.
	CREATE TABLE splits (
		id INTEGER PRIMARY KEY,
		transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
		category_id INTEGER NOT NULL REFERENCES categories(id),
		amount_cents INTEGER NOT NULL,
		source TEXT NOT NULL DEFAULT 'hand' CHECK (source IN ('hand', 'regel', 'naam'))
	);
	CREATE INDEX splits_tx ON splits(transaction_id);
	CREATE INDEX splits_cat ON splits(category_id);

	-- field: 'iban' en 'mcc' vergelijken exact, 'tegenpartij' en 'omschrijving' op 'is' of 'bevat'.
	CREATE TABLE rules (
		id INTEGER PRIMARY KEY,
		field TEXT NOT NULL CHECK (field IN ('iban', 'tegenpartij', 'omschrijving', 'mcc')),
		op TEXT NOT NULL DEFAULT 'is' CHECK (op IN ('is', 'bevat')),
		pattern TEXT NOT NULL,
		category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		UNIQUE (field, op, pattern)
	);

	CREATE TABLE settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	`,
	// Twee soorten mappen: 'budget' (elke maand opnieuw) en 'pot' (bouwt op), plus doel, geldplek en icoon.
	`
	CREATE TABLE categories_new (
		id INTEGER PRIMARY KEY,
		parent_id INTEGER REFERENCES categories(id),
		tree TEXT NOT NULL CHECK (tree IN ('uitgaven', 'inkomsten')),
		name TEXT NOT NULL,
		behavior TEXT CHECK (behavior IN ('budget', 'pot')),
		monthly_cents INTEGER,
		opening_cents INTEGER NOT NULL DEFAULT 0,
		start_month TEXT,
		goal_cents INTEGER,
		goal_date TEXT,
		funding TEXT CHECK (funding IN ('spaar', 'betaal')),
		icon TEXT,
		sort INTEGER NOT NULL DEFAULT 0,
		archived INTEGER NOT NULL DEFAULT 0
	);
	INSERT INTO categories_new (id, parent_id, tree, name, behavior, monthly_cents, opening_cents, start_month, funding, sort, archived)
	SELECT id, parent_id, tree, name,
		-- Een meegaand budget zonder bedrag wordt een gewoon budget; met bedrag een pot op de betaalrekening.
		CASE WHEN behavior = 'sparen' OR (behavior = 'budget_mee' AND monthly_cents IS NOT NULL) THEN 'pot' WHEN behavior IS NULL THEN NULL ELSE 'budget' END,
		monthly_cents, opening_cents, start_month,
		CASE WHEN behavior = 'sparen' THEN 'spaar' WHEN behavior = 'budget_mee' AND monthly_cents IS NOT NULL THEN 'betaal' END,
		sort, archived
	FROM categories;
	DROP TABLE categories;
	ALTER TABLE categories_new RENAME TO categories;
	UPDATE categories SET icon = CASE name
		WHEN 'Wonen' THEN 'home' WHEN 'Vervoer' THEN 'car' WHEN 'Zorg' THEN 'heart' WHEN 'Levensonderhoud' THEN 'cart'
		WHEN 'Vrije tijd' THEN 'sun' WHEN 'Sparen' THEN 'piggy' WHEN 'Overig' THEN 'dots' WHEN 'Vakantie' THEN 'plane'
		WHEN 'Onderhoud huis' THEN 'wrench' WHEN 'Onderhoud' THEN 'wrench' WHEN 'Woonverzekering' THEN 'shield' WHEN 'Verzekering' THEN 'shield'
		WHEN 'Lokale lasten' THEN 'building' WHEN 'Wegenbelasting' THEN 'building' WHEN 'Brandstof' THEN 'fuel' WHEN 'OV' THEN 'train'
		WHEN 'Cadeautjes' THEN 'gift' WHEN 'Kleding' THEN 'shirt' WHEN 'Noodfonds' THEN 'umbrella' WHEN 'Afschrijving' THEN 'car'
		WHEN 'Salaris' THEN 'briefcase' WHEN 'Internet & telefoon' THEN 'phone' WHEN 'Gas, Water & Licht' THEN 'bolt'
		WHEN 'Uiteten, Terras & To-Go' THEN 'cup' WHEN 'Boodschappen' THEN 'cart' WHEN 'Entertainment' THEN 'play'
	END;
	`,
	// Budget (of geplande inleg) per maand. 'vanaf' geldt vanaf die maand tot de volgende 'vanaf';
	// 'alleen' wijkt af voor precies één maand. '0000-00' betekent: vanaf het begin.
	// categories.monthly_cents wordt niet meer gebruikt.
	`
	CREATE TABLE budgets (
		category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
		month TEXT NOT NULL,
		scope TEXT NOT NULL CHECK (scope IN ('vanaf', 'alleen')),
		amount_cents INTEGER NOT NULL,
		PRIMARY KEY (category_id, month, scope)
	);
	INSERT INTO budgets (category_id, month, scope, amount_cents)
		SELECT id, '0000-00', 'vanaf', monthly_cents FROM categories WHERE monthly_cents IS NOT NULL;
	UPDATE categories SET monthly_cents = NULL;
	`,
	// v4: inloggen. Wachtwoorden als scrypt-hash, TOTP-geheim per gebruiker, sessies als hash van het token.
	`
	CREATE TABLE users (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL UNIQUE COLLATE NOCASE,
		pass_hash TEXT NOT NULL,
		totp_secret TEXT NOT NULL,
		totp_last INTEGER NOT NULL DEFAULT 0,
		created_at TEXT NOT NULL DEFAULT (datetime('now'))
	);
	CREATE TABLE sessions (
		token_hash TEXT PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		expires_at TEXT NOT NULL
	);
	`,
	// v5: een uitgave op een spaarpot kan van de lopende rekening betaald zijn zonder dat het geld uit de pot gaat.
	// from_pot = 0: telt mee als uitgegeven, maar het saldo van de pot blijft gelijk.
	`
	ALTER TABLE splits ADD COLUMN from_pot INTEGER NOT NULL DEFAULT 1;
	`,
	// v6: teruggaven. Bij een uitgave het bedrag dat je nog terugverwacht; een binnenkomende boeking
	// die daarvoor terugkomt wijst met refund_of naar die uitgave en volgt de indeling ervan.
	`
	ALTER TABLE transactions ADD COLUMN refund_expected INTEGER;
	ALTER TABLE transactions ADD COLUMN refund_of INTEGER REFERENCES transactions(id);
	CREATE INDEX transactions_refund_of ON transactions(refund_of);
	`,
	// v7: alles is een budget. Een map met budgetten eronder is alleen een groep die optelt; wat er direct op
	// stond gaat naar een subbudget, en elk budget krijgt zijn eigen soort en geldplek in plaats van te erven.
	groupsOnly,
	// v8: de iOS-app. Elke telefoon krijgt na inloggen een eigen sleutel (alleen als hash bewaard), die je kunt intrekken.
	`
	CREATE TABLE devices (
		id INTEGER PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		name TEXT NOT NULL,
		token_hash TEXT NOT NULL UNIQUE,
		created_at TEXT NOT NULL DEFAULT (datetime('now')),
		last_used_at TEXT
	);
	`,
	// v9: twee niveaus. Bij uitgaven een groep met budgetten erin, bij inkomsten alleen budgetten; geen groepen in groepen.
	twoLevels,
	// v10: een groep kiest zelf zijn kleur (accent, lucht, koraal, mint of zon); leeg = automatisch op volgorde.
	`
	ALTER TABLE categories ADD COLUMN color TEXT;
	`
];

function open(): DatabaseSync {
	mkdirSync(DATA_DIR, { recursive: true });
	const db = new DatabaseSync(join(DATA_DIR, 'stax.db'));
	db.exec('PRAGMA journal_mode = WAL;');
	const { user_version } = db.prepare('PRAGMA user_version').get() as { user_version: number };
	// Tabellen ombouwen kan alleen met foreign keys uit; dat moet buiten de transactie.
	db.exec('PRAGMA foreign_keys = OFF;');
	for (let v = user_version; v < MIGRATIONS.length; v++) {
		transaction(db, () => {
			const step = MIGRATIONS[v];
			if (typeof step === 'string') db.exec(step);
			else step(db);
			db.exec(`PRAGMA user_version = ${v + 1}`);
		});
	}
	if (user_version === 0)
		transaction(db, () => {
			seed(db);
			groupsOnly(db);
			twoLevels(db);
		});
	const broken = db.prepare('PRAGMA foreign_key_check').all();
	if (broken.length) throw new Error(`Database klopt niet na migratie: ${JSON.stringify(broken)}`);
	db.exec('PRAGMA foreign_keys = ON;');
	return db;
}

// Geneste transacties worden savepoints, zodat een functie die zelf een transactie gebruikt
// ook binnen een andere transactie aangeroepen kan worden.
const depth = new WeakMap<DatabaseSync, number>();

export function transaction<T>(database: DatabaseSync, fn: () => T): T {
	const level = depth.get(database) ?? 0;
	const sp = `sp${level}`;
	database.exec(level === 0 ? 'BEGIN' : `SAVEPOINT ${sp}`);
	depth.set(database, level + 1);
	try {
		const result = fn();
		database.exec(level === 0 ? 'COMMIT' : `RELEASE ${sp}`);
		return result;
	} catch (e) {
		database.exec(level === 0 ? 'ROLLBACK' : `ROLLBACK TO ${sp}; RELEASE ${sp}`);
		throw e;
	} finally {
		depth.set(database, level);
	}
}

// Bewaar de verbinding op globalThis zodat hot reload in dev geen tweede verbinding opent.
const g = globalThis as unknown as { __staxDb?: DatabaseSync };
export const db = (g.__staxDb ??= open());

export function tx<T>(fn: () => T): T {
	return transaction(db, fn);
}

export function getSetting(key: string): string | null {
	const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
	return row?.value ?? null;
}

export function setSetting(key: string, value: string | null) {
	if (value === null) db.prepare('DELETE FROM settings WHERE key = ?').run(key);
	else db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, value);
}
