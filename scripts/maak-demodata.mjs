// Vervangt de testdatabase (data-test/) door verzonnen gegevens van een fictief huishouden.
// Alles heet duidelijk "Test…", "Voorbeeld…" of "Demo…", zodat niemand het voor echt aanziet.
// Gebruikers en gekoppelde apparaten (de simulator) blijven staan.
//
//   node scripts/maak-demodata.mjs
//   npm run dev:test        → http://localhost:5181
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const db = new DatabaseSync(resolve('data-test/stax.db'));
const icons = new Set([...readFileSync('src/lib/material-icons.ts', 'utf8').matchAll(/\["([a-z0-9_]+)", "/g)].map((m) => m[1]));
const icon = (n) => (n && icons.has(n) ? n : null);

// Vaste reeks, zodat elke run dezelfde gegevens geeft.
let seed = 20261109;
const rnd = () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (a, b) => Math.round(a + rnd() * (b - a));
const pick = (list) => list[Math.floor(rnd() * list.length)];

db.exec('PRAGMA foreign_keys = OFF; BEGIN');
for (const t of ['splits', 'rules', 'budgets', 'statements', 'imports']) db.exec(`DELETE FROM ${t}`);
db.exec('UPDATE transactions SET transfer_tx_id = NULL, refund_of = NULL');
for (const t of ['transactions', 'categories', 'accounts']) db.exec(`DELETE FROM ${t}`);
db.exec("DELETE FROM settings WHERE key = 'restpot'");

// ── Rekeningen ──────────────────────────────────────────────────────────────
const account = (iban, name, kind) => Number(db.prepare('INSERT INTO accounts (iban, name, kind) VALUES (?, ?, ?)').run(iban, name, kind).lastInsertRowid);
const betaal = account('NL00TEST0000000001', 'Testrekening (betalen)', 'betaal');
const spaar = account('NL00TEST0000000002', 'Testrekening (sparen)', 'spaar');

// ── Budgetten ───────────────────────────────────────────────────────────────
const cat = db.prepare('INSERT INTO categories (parent_id, tree, name, behavior, opening_cents, start_month, goal_cents, goal_date, funding, icon, sort) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const plan = db.prepare("INSERT INTO budgets (category_id, month, scope, amount_cents) VALUES (?, '0000-00', 'vanaf', ?)");
const START = '2026-08';
const root = (tree, name) => Number(cat.run(null, tree, name, null, 0, null, null, null, null, null, 0).lastInsertRowid);
const uitgaven = root('uitgaven', 'Uitgaven');
const inkomsten = root('inkomsten', 'Inkomsten');
const ids = {};
let sort = 0;
function group(name, ic, budgets) {
	const g = Number(cat.run(uitgaven, 'uitgaven', name, null, 0, null, null, null, null, icon(ic), sort++).lastInsertRowid);
	budgets.forEach(([key, label, ico, monthly, opts = {}], i) => {
		const pot = !!opts.pot;
		const id = Number(
			cat.run(g, 'uitgaven', label, pot ? 'pot' : 'budget', opts.opening ?? 0, START, opts.goal ?? null, opts.date ?? null, pot ? 'spaar' : null, icon(ico), i).lastInsertRowid
		);
		if (monthly) plan.run(id, monthly);
		ids[key] = id;
	});
}
group('Wonen', 'home', [
	['huur', 'Huur', 'home', 115000],
	['energie', 'Energie', 'bolt', 15000],
	['internet', 'Internet & tv', 'mobile', 4250],
	['onderhoud', 'Onderhoud woning', 'build', 10000, { pot: true, opening: 45000 }]
]);
group('Mobiliteit', 'directions_car', [
	['ov', 'OV & fiets', 'train', 8900],
	['brandstof', 'Brandstof', 'local_gas_station', 22000],
	['parkeren', 'Parkeren', null, 2500],
	['autoverz', 'Autoverzekering', 'shield', 6500, { pot: true, opening: 26000 }],
	['wegenbelasting', 'Wegenbelasting', 'account_balance', 4000, { pot: true, opening: 12000 }]
]);
group('Boodschappen & eten', 'shopping_cart', [
	['supermarkt', 'Supermarkt', 'shopping_cart', 52000],
	['drogist', 'Drogist', null, 4000],
	['uiteten', 'Uit eten & koffie', 'local_cafe', 14000]
]);
group('Gezondheid', 'favorite', [
	['zorgA', 'Zorgpremie A', null, 13800],
	['zorgB', 'Zorgpremie B', null, 13800],
	['apotheek', 'Apotheek & tandarts', null, 2500],
	['risico', 'Eigen risico', null, 3300, { pot: true, opening: 16500, goal: 38500, date: '2027-01' }]
]);
group('Vrije tijd', 'sunny', [
	['streaming', 'Streaming & abonnementen', 'live_tv', 2500],
	['uitjes', 'Uitjes', null, 6000],
	['cadeaus', 'Cadeaus', 'redeem', 4000],
	['kleding', 'Kleding', 'checkroom', 9000],
	['vakantie', 'Vakantie', 'flight', 15000, { pot: true, opening: 60000, goal: 240000, date: '2027-07' }]
]);
group('Sparen', 'savings', [['noodfonds', 'Noodfonds', 'umbrella', 20000, { pot: true, opening: 240000, goal: 600000 }]]);
group('Overig', 'more_horiz', [
	['bank', 'Bankkosten', null, 300],
	['onvoorzien', 'Onvoorzien', null, 3000]
]);
const income = (key, name, ico, monthly) => {
	const id = Number(cat.run(inkomsten, 'inkomsten', name, 'budget', 0, START, null, null, null, icon(ico), Object.keys(ids).length).lastInsertRowid);
	if (monthly) plan.run(id, monthly);
	ids[key] = id;
};
income('salaris', 'Testsalaris', 'work', 328000);
income('bijverdienste', 'Bijverdienste', null, 25000);
income('rente', 'Rente', null, 0);
income('terug', 'Teruggaven & vergoedingen', null, 0);

// ── Regels ──────────────────────────────────────────────────────────────────
const rule = db.prepare("INSERT INTO rules (field, op, pattern, category_id) VALUES ('tegenpartij', 'bevat', ?, ?)");
const rules = [
	['Testwinkel Supermarkt', 'supermarkt'], ['Voorbeeld Verhuur', 'huur'], ['Voorbeeld Energie', 'energie'], ['Demo Telecom', 'internet'],
	['Test Tankstation', 'brandstof'], ['Demo Streaming', 'streaming'], ['Proefcafé', 'uiteten'], ['Test Zorgverzekering A', 'zorgA'],
	['Test Zorgverzekering B', 'zorgB'], ['Voorbeeld Openbaar Vervoer', 'ov'], ['Test Drogisterij', 'drogist'], ['Test Apotheek', 'apotheek']
];
for (const [pattern, key] of rules) rule.run(pattern, ids[key]);
const ruled = (cp) => rules.some(([p]) => cp.includes(p));

// ── Boekingen ───────────────────────────────────────────────────────────────
const imp = Number(db.prepare("INSERT INTO imports (filename, account_id, n_total, n_new) VALUES ('demodata', ?, 0, 0)").run(betaal).lastInsertRowid);
const impSpaar = Number(db.prepare("INSERT INTO imports (filename, account_id, n_total, n_new) VALUES ('demodata', ?, 0, 0)").run(spaar).lastInsertRowid);
const insertTx = db.prepare(
	`INSERT INTO transactions (account_id, import_id, bank_ref, booking_date, amount_cents, counterparty, counterparty_iban, description, bank_code, transfer_account_id, transfer_tx_id, note, refund_expected)
	 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
);
const insertSplit = db.prepare('INSERT INTO splits (transaction_id, category_id, amount_cents, source, from_pot) VALUES (?, ?, ?, ?, 1)');
const sums = { [betaal]: 0, [spaar]: 0 };
let n = 0;
function tx(acct, date, cents, cp, desc, key, o = {}) {
	const id = Number(
		insertTx.run(acct, acct === betaal ? imp : impSpaar, `${date.replaceAll('-', '')}-${++n}`, date, cents, cp, o.iban ?? 'NL00TEST0000000099', desc, o.code ?? 'ICDT/ESCT', o.transfer ?? null, o.pair ?? null, o.note ?? null, o.refund ?? null)
			.lastInsertRowid
	);
	sums[acct] += cents;
	if (key) insertSplit.run(id, ids[key], cents, ruled(cp) ? 'regel' : 'hand');
	return id;
}
/** Een overboeking naar de spaarrekening; de inleg wordt aan een pot toegekend. */
function inleg(date, cents, key) {
	const out = tx(betaal, date, -cents, 'Testpersoon (spaarrekening)', `Inleg ${key}`, null, { transfer: spaar, iban: 'NL00TEST0000000002' });
	const into = tx(spaar, date, cents, 'Testpersoon (betaalrekening)', `Inleg ${key}`, key, { transfer: betaal, pair: out, iban: 'NL00TEST0000000001' });
	db.prepare('UPDATE transactions SET transfer_tx_id = ? WHERE id = ?').run(into, out);
}
const d = (y, m, day) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const FROM = '2026-08-24';
const TO = '2026-11-08';
const inRange = (date) => date >= FROM && date <= TO;
const maybe = (date, ...args) => inRange(date) && tx(betaal, date, ...args);

for (const [y, m] of [[2026, 8], [2026, 9], [2026, 10], [2026, 11]]) {
	maybe(d(y, m, 1), -115000, 'Voorbeeld Verhuur B.V.', `Huur ${m}`, 'huur');
	maybe(d(y, m, 3), -between(13200, 17800), 'Voorbeeld Energie N.V.', 'Termijnbedrag energie', 'energie');
	maybe(d(y, m, 5), -4250, 'Demo Telecom', 'Internet en tv', 'internet');
	maybe(d(y, m, 12), -13800, 'Test Zorgverzekering A', 'Premie', 'zorgA');
	maybe(d(y, m, 12), -13800, 'Test Zorgverzekering B', 'Premie', 'zorgB');
	maybe(d(y, m, 15), -1199, 'Demo Streaming', 'Abonnement', 'streaming');
	maybe(d(y, m, 20), -8900, 'Voorbeeld Openbaar Vervoer', 'Maandabonnement', 'ov');
	maybe(d(y, m, 25), 328000, 'Voorbeeld Werkgever B.V.', `Testsalaris ${m}`, 'salaris');
	maybe(d(y, m, 28), -300, 'Voorbeeldbank', 'Pakketkosten', 'bank');
	if (inRange(d(y, m, 25))) for (const [key, c] of [['noodfonds', 20000], ['vakantie', 15000], ['onderhoud', 10000], ['risico', 3300], ['autoverz', 6500], ['wegenbelasting', 4000]]) inleg(d(y, m, 25), c, key);
}
maybe('2026-10-14', 25000, 'Test Opdrachtgever', 'Factuur 2026-014', 'bijverdienste');

// Boodschappen en uitjes door de weken heen. Het nieuwste deel blijft deels ongeïndeeld.
const shops = ['Testwinkel Supermarkt', 'Testwinkel Supermarkt', 'Testwinkel Supermarkt', 'Test Markt Voorbeeldstad'];
const places = ['Proefcafé De Hoek', 'Proefcafé Het Plein', 'Test Pizzeria', 'Demo Lunchroom'];
const open = (date) => date >= '2026-11-02' && rnd() < 0.6;
for (let t = new Date(`${FROM}T12:00:00Z`); t <= new Date(`${TO}T12:00:00Z`); t.setUTCDate(t.getUTCDate() + 1)) {
	const date = t.toISOString().slice(0, 10);
	const dow = t.getUTCDay();
	if ([1, 3, 6].includes(dow)) {
		const cp = pick(shops);
		tx(betaal, date, -between(1100, 9800), cp, 'Pinbetaling', open(date) || cp.includes('Markt') && rnd() < 0.3 ? null : 'supermarkt', { code: 'CCRD/POSD' });
	}
	if (dow === 0 && rnd() < 0.8) {
		const cp = pick(places);
		tx(betaal, date, -between(1200, 6800), cp, 'Pinbetaling', open(date) ? null : 'uiteten', { code: 'CCRD/POSD' });
	}
	if (dow === 4 && rnd() < 0.45) tx(betaal, date, -between(4400, 7600), 'Test Tankstation', 'Tanken', 'brandstof', { code: 'CCRD/POSD' });
	if (dow === 2 && rnd() < 0.3) tx(betaal, date, -between(900, 2900), 'Test Drogisterij', 'Pinbetaling', open(date) ? null : 'drogist', { code: 'CCRD/POSD' });
	if (dow === 5 && rnd() < 0.25) tx(betaal, date, -between(1500, 4500), 'Testbioscoop Centrum', 'Tickets', open(date) ? null : 'uitjes', { code: 'CCRD/POSD' });
	if (rnd() < 0.04) tx(betaal, date, -between(800, 1600), 'Test Parkeerservice', 'Parkeren', open(date) ? null : 'parkeren', { code: 'CCRD/POSD' });
}
tx(betaal, '2026-09-18', -8995, 'Fictief Kledingwinkel', 'Jas', 'kleding');
tx(betaal, '2026-10-09', -4500, 'Fictief Boekhandel', 'Cadeau', 'cadeaus');
tx(betaal, '2026-10-22', -2350, 'Test Apotheek', 'Recept', 'apotheek');
tx(betaal, '2026-10-30', -12900, 'Fictief Warenhuis', 'Regenjas, retour onderweg', 'kleding', { refund: 6000 });
tx(betaal, '2026-11-04', -3450, 'Onbekend Testbedrijf', 'Factuur 88', null);
tx(betaal, '2026-11-06', 1800, 'Testpersoon (tikkie)', 'Terugbetaling etentje', null);

// ── Afschriften en instellingen ─────────────────────────────────────────────
const statement = db.prepare('INSERT INTO statements (import_id, account_id, opening_cents, opening_date, closing_cents, closing_date) VALUES (?, ?, ?, ?, ?, ?)');
const opening = { [betaal]: 185000, [spaar]: 399500 };
statement.run(imp, betaal, opening[betaal], FROM, opening[betaal] + sums[betaal], TO);
statement.run(impSpaar, spaar, opening[spaar], FROM, opening[spaar] + sums[spaar], TO);
db.prepare("INSERT INTO settings (key, value) VALUES ('startdatum', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(FROM);
const broken = db.prepare('PRAGMA foreign_key_check').all();
if (broken.length) {
	db.exec('ROLLBACK');
	throw new Error('Verwijzingen kloppen niet: ' + JSON.stringify(broken));
}
db.exec('COMMIT');
console.log(`Demodata in data-test/: ${n} boekingen van ${FROM} t/m ${TO}.`);
