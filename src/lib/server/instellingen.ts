import { db, getSetting, setSetting, tx } from './db';
import { holdsSavings, loadTree } from './categories';
import { accountBalance, accounts, incomePotId } from './reports';
import { parseMoney } from '$lib/format';

// Startsaldo: de datum waarvanaf spaarsaldi tellen en wat er op die dag in elke pot zat. Gedeeld door de website en de app.

function dayBefore(date: string): string {
	const d = new Date(date + 'T12:00:00Z');
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

export function startData(datum: string | null) {
	// Voorstel: de eerste dag waarvan er boekingen zijn, zodat alle inleg daarna meetelt.
	const first = (db.prepare('SELECT MIN(booking_date) AS d FROM transactions').get() as { d: string | null }).d;
	const suggested = first ?? new Date().toISOString().slice(0, 10);
	const startdatum = datum ?? getSetting('startdatum') ?? suggested;
	const savings = accounts().filter((a) => a.kind === 'spaar');
	const balance = savings.reduce((s, a) => s + (accountBalance(a.id, dayBefore(startdatum)) ?? 0), 0);
	const tree = loadTree();
	// Alleen potten waarvan het geld op de spaarrekening staat (en mappen met zulke potten eronder) verdelen het saldo.
	const isPot = (id: number | null) => {
		const n = id != null ? tree.byId.get(id) : undefined;
		return !!n && holdsSavings(n);
	};
	const pots = tree.flat
		.filter((n) => isPot(n.id))
		.map((n) => ({
			id: n.id,
			name: n.name,
			// Staat de bovenliggende map zelf niet in de lijst, dan tonen we het pad als context.
			context: isPot(n.parent_id) ? '' : n.path.join(' › '),
			depth: n.depth,
			opening_cents: n.opening_cents,
			isGroup: n.children.length > 0
		}));
	return { startdatum, saved: getSetting('startdatum'), balance, pots, incomePot: incomePotId(tree), hasSavings: savings.length > 0 };
}

/** Bewaart de startdatum, de inkomstenpot en het startsaldo per pot (sleutel = pot-id). Geeft een foutmelding of null. */
export function saveStart(datum: string, incomePot: number | null, openings: Record<string, string | number>): string | null {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return 'Kies een geldige startdatum.';
	tx(() => {
		setSetting('startdatum', datum);
		setSetting('inkomstenpot', String(incomePot || ''));
		const update = db.prepare('UPDATE categories SET opening_cents = ? WHERE id = ?');
		for (const [id, value] of Object.entries(openings)) update.run(typeof value === 'number' ? value : (parseMoney(value) ?? 0), Number(id));
	});
	return null;
}
