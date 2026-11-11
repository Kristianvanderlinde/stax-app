// Maakt src/lib/material-icons.ts: een selectie Google Material Symbols (rounded, filled) met Nederlandse zoekwoorden.
// De iconen staan daarna in de code; het pakket is alleen nodig om de lijst opnieuw te maken.
//   npm pack @material-symbols/svg-400 && tar xzf material-symbols-svg-400-*.tgz
//   node scripts/material-iconen.mjs <map met uitgepakt pakket>
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('Geef de map van het uitgepakte pakket @material-symbols/svg-400 op.');

// [groep, [[icoon, zoekwoorden], …]]
const GROUPS = [
	['Wonen', [
		['home', 'huis wonen thuis'], ['house', 'huis woning'], ['apartment', 'appartement flat'], ['cottage', 'huisje vakantiehuis'],
		['key', 'sleutel huur hypotheek'], ['chair', 'stoel meubels'], ['bed', 'bed slapen'], ['weekend', 'bank meubels'],
		['kitchen', 'keuken koelkast'], ['countertops', 'aanrecht keuken'], ['bathtub', 'bad badkamer'], ['shower', 'douche'],
		['yard', 'tuin'], ['grass', 'gras tuin'], ['potted_plant', 'plant tuin'], ['local_florist', 'bloemen'],
		['handyman', 'klussen gereedschap onderhoud'], ['build', 'onderhoud gereedschap'], ['construction', 'verbouwing bouw'],
		['format_paint', 'verf schilderen'], ['roofing', 'dak'], ['window', 'raam'], ['door_front', 'deur'],
		['bolt', 'energie stroom elektriciteit'], ['electric_bolt', 'stroom energie'], ['water_drop', 'water'],
		['local_fire_department', 'gas verwarming'], ['heat', 'verwarming warmte'], ['solar_power', 'zonnepanelen'],
		['lightbulb', 'lamp licht'], ['cleaning_services', 'schoonmaak'], ['local_laundry_service', 'was wasmachine'],
		['delete', 'afval vuilnis'], ['recycling', 'afval recycling'], ['account_balance', 'gemeente belasting overheid'],
		['shield', 'verzekering'], ['security', 'beveiliging verzekering'], ['verified_user', 'verzekering']
	]],
	['Vervoer', [
		['directions_car', 'auto'], ['electric_car', 'elektrische auto'], ['local_gas_station', 'brandstof benzine tanken'],
		['ev_station', 'laden laadpaal'], ['local_parking', 'parkeren'], ['car_repair', 'garage onderhoud auto'],
		['tire_repair', 'banden'], ['local_car_wash', 'wasstraat'], ['train', 'trein ov'], ['directions_bus', 'bus ov'],
		['tram', 'tram'], ['subway', 'metro'], ['directions_bike', 'fiets'], ['electric_bike', 'e-bike fiets'],
		['two_wheeler', 'scooter motor'], ['electric_scooter', 'step'], ['local_taxi', 'taxi'], ['flight', 'vliegtuig vliegen'],
		['directions_boat', 'boot'], ['toll', 'tol'], ['commute', 'woon-werk reizen']
	]],
	['Eten en boodschappen', [
		['shopping_cart', 'boodschappen supermarkt'], ['shopping_basket', 'boodschappen mand'], ['grocery', 'boodschappen'],
		['nutrition', 'fruit groente'], ['bakery_dining', 'bakker brood'], ['egg', 'ei'], ['restaurant', 'uiteten restaurant'],
		['lunch_dining', 'lunch hamburger'], ['local_pizza', 'pizza'], ['ramen_dining', 'ramen eten'], ['takeout_dining', 'afhaal bezorgen'],
		['moped', 'bezorging scooter'], ['local_cafe', 'koffie cafe'], ['coffee', 'koffie'], ['local_bar', 'bar borrel'],
		['sports_bar', 'bier bar'], ['wine_bar', 'wijn'], ['icecream', 'ijs'], ['cake', 'taart'], ['liquor', 'drank']
	]],
	['Zorg en verzorging', [
		['favorite', 'hart zorg liefde'], ['health_and_safety', 'zorg gezondheid'], ['medical_services', 'zorg dokter'],
		['local_hospital', 'ziekenhuis'], ['medication', 'medicijnen apotheek'], ['vaccines', 'prik vaccinatie'],
		['dentistry', 'tandarts'], ['visibility', 'bril ogen opticien'], ['psychology', 'psycholoog'], ['spa', 'spa wellness'],
		['content_cut', 'kapper knippen'], ['face', 'verzorging gezicht'], ['soap', 'zeep verzorging'], ['fitness_center', 'sport fitness'],
		['self_improvement', 'yoga ontspanning'], ['monitor_heart', 'hartslag zorg']
	]],
	['Kleding en spullen', [
		['checkroom', 'kleding'], ['apparel', 'kleding shirt'], ['styler', 'kleding'], ['steps', 'schoenen'], ['diamond', 'sieraden'],
		['watch', 'horloge'], ['shopping_bag', 'winkelen tas'], ['storefront', 'winkel'], ['local_mall', 'winkelen'],
		['devices', 'apparaten'], ['mobile', 'telefoon mobiel'], ['computer', 'computer laptop'], ['headphones', 'koptelefoon muziek'],
		['photo_camera', 'camera foto'], ['tv', 'tv televisie'], ['videogame_asset', 'games spelletjes'], ['print', 'printer']
	]],
	['Vrije tijd', [
		['sunny', 'zon vrije tijd'], ['beach_access', 'strand vakantie'], ['luggage', 'koffer vakantie reizen'], ['travel', 'reizen'],
		['hotel', 'hotel'], ['camping', 'kamperen'], ['hiking', 'wandelen'], ['map', 'kaart uitjes'], ['attractions', 'pretpark'],
		['theater_comedy', 'theater'], ['movie', 'film bioscoop'], ['music_note', 'muziek'], ['stadium', 'concert festival'],
		['confirmation_number', 'ticket kaartjes'], ['museum', 'museum'], ['palette', 'kunst schilderen'], ['brush', 'kunst'],
		['menu_book', 'boeken lezen'], ['auto_stories', 'boeken'], ['sports_soccer', 'voetbal sport'], ['sports_tennis', 'tennis'],
		['pool', 'zwemmen'], ['downhill_skiing', 'skien wintersport'], ['celebration', 'feest'], ['redeem', 'cadeau'],
		['casino', 'spel loterij'], ['extension', 'puzzel hobby'], ['pets', 'huisdier dier'], ['cruelty_free', 'konijn huisdier']
	]],
	['Abonnementen en communicatie', [
		['wifi', 'internet wifi'], ['router', 'internet'], ['call', 'telefoon bellen'], ['sim_card', 'simkaart mobiel abonnement'],
		['subscriptions', 'abonnementen'], ['live_tv', 'streaming tv'], ['cloud', 'cloud opslag'], ['newspaper', 'krant'],
		['mail', 'post brief'], ['smart_toy', 'ai'], ['apps', 'apps software']
	]],
	['Geld', [
		['savings', 'spaarpot sparen'], ['account_balance_wallet', 'portemonnee'], ['wallet', 'portemonnee'], ['payments', 'geld betalen'],
		['euro', 'euro geld'], ['credit_card', 'creditcard pas'], ['account_balance', 'bank'], ['request_quote', 'factuur'],
		['receipt_long', 'bon factuur'], ['trending_up', 'beleggen groei'], ['monitoring', 'beleggen'], ['percent', 'rente'],
		['work', 'werk salaris'], ['business_center', 'werk zakelijk'], ['volunteer_activism', 'goede doelen geven'],
		['handshake', 'afspraak'], ['gavel', 'notaris juridisch'], ['description', 'document'], ['umbrella', 'noodfonds buffer'],
		['emergency', 'nood'], ['target', 'doel'], ['flag', 'doel vlag'], ['star', 'ster favoriet'], ['undo', 'teruggave'],
		['currency_exchange', 'wisselen'], ['price_change', 'prijs']
	]],
	['Gezin', [
		['family_restroom', 'gezin familie'], ['child_care', 'kinderopvang baby'], ['child_friendly', 'kinderwagen baby'],
		['toys', 'speelgoed'], ['school', 'school studie'], ['backpack', 'school'], ['group', 'mensen groep'], ['person', 'persoon'],
		['wc', 'wc'], ['church', 'kerk']
	]],
	['Overig', [
		['more_horiz', 'overig'], ['category', 'categorie overig'], ['label', 'label'], ['bookmark', 'bladwijzer'], ['inventory_2', 'doos opslag'],
		['local_shipping', 'verzending'], ['public', 'wereld'], ['eco', 'duurzaam'], ['help', 'vraag onbekend']
	]]
];

const seen = new Set();
const out = [];
for (const [group, icons] of GROUPS) {
	const list = [];
	for (const [name, words] of icons) {
		if (seen.has(name)) continue;
		seen.add(name);
		// Sommige iconen hebben geen aparte gevulde versie; dan is de gewone al gevuld.
		const file = [`${name}-fill.svg`, `${name}.svg`].map((f) => join(dir, 'rounded', f)).find(existsSync);
		if (!file) {
			console.warn(`niet gevonden: ${name}`);
			continue;
		}
		const svg = readFileSync(file, 'utf8');
		const d = [...svg.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).join('');
		list.push(`\t\t[${JSON.stringify(name)}, ${JSON.stringify(words)}, ${JSON.stringify(d)}]`);
	}
	out.push(`\t[${JSON.stringify(group)}, [\n${list.join(',\n')}\n\t]]`);
}

writeFileSync(
	'src/lib/material-icons.ts',
	`// Gemaakt met scripts/material-iconen.mjs. Niet met de hand aanpassen.
// Google Material Symbols, rounded, filled (Apache License 2.0). Raster 960 × 960, viewBox "0 -960 960 960".
export type MaterialIcon = [name: string, words: string, path: string];

export const MATERIAL_GROUPS: [group: string, icons: MaterialIcon[]][] = [
${out.join(',\n')}
];
`
);
console.log(`${seen.size} iconen`);
