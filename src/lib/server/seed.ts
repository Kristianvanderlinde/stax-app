import type { DatabaseSync } from 'node:sqlite';
import type { Behavior, Funding } from '$lib/types';

// Startindeling, overgenomen uit Actual Budget. Alles is daarna in Stax aan te passen.
// [naam, soort (null = overnemen), geldplek van een pot, icoon, budgetten in de groep]. Twee niveaus: groep › budget.
type SeedNode = [name: string, behavior: Behavior | null, funding: Funding | null, icon: string | null, children?: SeedNode[]];

const UITGAVEN: SeedNode[] = [
	['Wonen', 'budget', null, 'home', [
		['Hypotheek', null, null, null],
		['Gas, Water & Licht', null, null, 'bolt'],
		['Internet & telefoon', null, null, 'phone'],
		['Woonverzekering', 'pot', 'spaar', 'shield'],
		['Onderhoud huis', 'pot', 'spaar', 'wrench'],
		['Lokale lasten', 'pot', 'spaar', 'building'],
		['Huis & Tuin', null, null, null]
	]],
	['Vervoer', 'budget', null, 'car', [
		['OV', null, null, 'train'],
		['Brandstof', 'budget', null, 'fuel'],
		['Parkeren', null, null, null],
		['Autoverzekering', 'pot', 'spaar', 'shield'],
		['Wegenbelasting', 'pot', 'spaar', 'building'],
		['Onderhoud auto', 'pot', 'spaar', 'wrench']
	]],
	['Zorg', 'pot', 'spaar', 'heart', [
		['Zorgpremie', null, null, null],
		['Overige zorgkosten', null, null, null]
	]],
	['Levensonderhoud', 'budget', null, 'cart', [
		['Boodschappen', null, null, 'cart'],
		['Verzorging', null, null, null],
		['Kleding', null, null, 'shirt']
	]],
	['Vrije tijd', 'budget', null, 'sun', [
		['Entertainment', null, null, 'play'],
		['Cadeautjes', null, null, 'gift'],
		['Uitjes', null, null, null],
		['Vakantie', 'pot', 'spaar', 'plane'],
		['Uiteten, Terras & To-Go', null, null, 'cup']
	]],
	['Sparen', 'pot', 'spaar', 'piggy', [
		['Noodfonds', null, null, 'umbrella'],
		['Vrij sparen', null, null, null]
	]],
	['Overig', 'budget', null, 'dots', [['Bankkosten', null, null, null]]]
];

const INKOMSTEN: SeedNode[] = [
	['Salaris', null, null, 'briefcase'],
	['Extra inkomsten', null, null, null],
	['Rente', null, null, null],
	['Teruggaven & vergoedingen', null, null, null]
];

// Winkelsoort (MCC) van pinbetalingen → map. Alleen soorten die eenduidig zijn;
// warenhuizen als HEMA en Action (5310, 5311, 5399) laten we bewust open.
const MCC: Record<string, string> = {
	'5411': 'Boodschappen', '5422': 'Boodschappen', '5441': 'Boodschappen', '5451': 'Boodschappen',
	'5462': 'Boodschappen', '5499': 'Boodschappen',
	'5541': 'Brandstof', '5542': 'Brandstof',
	'4111': 'OV', '4112': 'OV', '4131': 'OV',
	'7523': 'Parkeren',
	'5812': 'Uiteten, Terras & To-Go', '5813': 'Uiteten, Terras & To-Go', '5814': 'Uiteten, Terras & To-Go',
	'5200': 'Huis & Tuin', '5211': 'Huis & Tuin', '5251': 'Huis & Tuin', '5261': 'Huis & Tuin',
	'5712': 'Huis & Tuin', '5719': 'Huis & Tuin',
	'5651': 'Kleding', '5661': 'Kleding', '5691': 'Kleding', '5699': 'Kleding',
	'5912': 'Verzorging', '5977': 'Verzorging', '7230': 'Verzorging',
	'4899': 'Entertainment', '5815': 'Entertainment', '5818': 'Entertainment',
	'7832': 'Uitjes', '7922': 'Uitjes', '7991': 'Uitjes', '7996': 'Uitjes'
};

export function seed(db: DatabaseSync) {
	const insert = db.prepare('INSERT INTO categories (parent_id, tree, name, behavior, funding, icon, sort) VALUES (?, ?, ?, ?, ?, ?, ?)');
	const ids = new Map<string, number>();

	function add(nodes: SeedNode[], parent: number, tree: string) {
		nodes.forEach(([name, behavior, funding, icon, children], i) => {
			const id = Number(insert.run(parent, tree, name, behavior, funding, icon, i).lastInsertRowid);
			ids.set(name, id);
			if (children) add(children, id, tree);
		});
	}

	const uitgaven = Number(insert.run(null, 'uitgaven', 'Uitgaven', 'budget', null, null, 0).lastInsertRowid);
	const inkomsten = Number(insert.run(null, 'inkomsten', 'Inkomsten', 'budget', null, null, 1).lastInsertRowid);
	add(UITGAVEN, uitgaven, 'uitgaven');
	add(INKOMSTEN, inkomsten, 'inkomsten');

	const rule = db.prepare("INSERT INTO rules (field, op, pattern, category_id) VALUES ('mcc', 'is', ?, ?)");
	for (const [mcc, name] of Object.entries(MCC)) {
		const id = ids.get(name);
		if (id) rule.run(mcc, id);
	}
}
