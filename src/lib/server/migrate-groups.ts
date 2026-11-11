import type { DatabaseSync } from 'node:sqlite';

// Migratie naar "alles is een budget": een map met budgetten eronder is alleen nog een groep die optelt.
// Wat direct op zo'n groep stond (boekingen, budget, regels, spaargeld) gaat naar een nieuw subbudget.
// Mag vaker draaien: een tweede keer verandert niets meer.

/** Oude lijniconen → Google Material Symbols. */
const ICONS: Record<string, string> = {
	home: 'home', car: 'directions_car', heart: 'favorite', cart: 'shopping_cart', sun: 'sunny', piggy: 'savings',
	plane: 'flight', wrench: 'build', shield: 'shield', building: 'account_balance', fuel: 'local_gas_station',
	train: 'train', gift: 'redeem', shirt: 'checkroom', umbrella: 'umbrella', briefcase: 'work', phone: 'mobile',
	bolt: 'bolt', cup: 'local_cafe', play: 'live_tv', coins: 'payments', dots: 'more_horiz'
};

interface Cat {
	id: number;
	parent_id: number | null;
	tree: 'uitgaven' | 'inkomsten';
	name: string;
	behavior: 'budget' | 'pot' | null;
	funding: 'spaar' | 'betaal' | null;
	opening_cents: number;
	goal_cents: number | null;
	goal_date: string | null;
	start_month: string | null;
	archived: number;
}

export function groupsOnly(db: DatabaseSync) {
	for (const [from, to] of Object.entries(ICONS)) db.prepare('UPDATE categories SET icon = ? WHERE icon = ?').run(to, from);

	const cats = db.prepare('SELECT id, parent_id, tree, name, behavior, funding, opening_cents, goal_cents, goal_date, start_month, archived FROM categories').all() as unknown as Cat[];
	const byId = new Map(cats.map((c) => [c.id, c]));
	const kids = (id: number) => cats.filter((c) => c.parent_id === id && !c.archived);

	// Soort en geldplek werden geërfd van de bovenliggende map; nu krijgt elk budget ze zelf.
	const effective = (c: Cat): { behavior: 'budget' | 'pot'; funding: 'spaar' | 'betaal' } => {
		const up = c.parent_id != null ? effective(byId.get(c.parent_id)!) : { behavior: 'budget' as const, funding: 'spaar' as const };
		return { behavior: c.behavior ?? up.behavior, funding: c.funding ?? up.funding };
	};

	const insert = db.prepare(
		`INSERT INTO categories (parent_id, tree, name, behavior, funding, opening_cents, goal_cents, goal_date, start_month, sort)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort), -1) + 1 FROM categories WHERE parent_id = ?))`
	);

	for (const c of cats) {
		if (kids(c.id).length === 0) {
			const e = effective(c);
			if (c.parent_id != null) db.prepare('UPDATE categories SET behavior = ?, funding = ? WHERE id = ?').run(e.behavior, e.behavior === 'pot' ? e.funding : null, c.id);
			continue;
		}
		const e = effective(c);

		// Spaargeld op de groep zelf (inleg, opnames, startsaldo) wordt een eigen spaarpot.
		const spaarSplits = db
			.prepare(
				`SELECT s.id FROM splits s JOIN transactions t ON t.id = s.transaction_id JOIN accounts a ON a.id = t.account_id
				 WHERE s.category_id = ? AND a.kind = 'spaar'`
			)
			.all(c.id) as { id: number }[];
		if (c.tree === 'uitgaven' && (spaarSplits.length || c.opening_cents)) {
			const pot = Number(insert.run(c.id, c.tree, 'Spaargeld', 'pot', 'spaar', c.opening_cents, null, null, c.start_month, c.id).lastInsertRowid);
			for (const s of spaarSplits) db.prepare('UPDATE splits SET category_id = ? WHERE id = ?').run(pot, s.id);
			// Regels op omschrijving die bij een boeking op de spaarrekening horen, gaan mee.
			db.prepare(
				`UPDATE rules SET category_id = ? WHERE category_id = ? AND field = 'omschrijving' AND pattern IN (
				 SELECT lower(t.description) FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE a.kind = 'spaar')`
			).run(pot, c.id);
			db.prepare('UPDATE categories SET opening_cents = 0 WHERE id = ?').run(c.id);
		}

		// De rest (boekingen, budget, regels, doel) gaat naar een subbudget.
		const has = (sql: string) => !!db.prepare(sql).get(c.id);
		const rest =
			has('SELECT 1 FROM splits WHERE category_id = ?') ||
			has('SELECT 1 FROM budgets WHERE category_id = ?') ||
			has('SELECT 1 FROM rules WHERE category_id = ?') ||
			(c.goal_cents != null && c.parent_id != null);
		if (rest) {
			const name = c.parent_id == null && c.tree === 'inkomsten' ? 'Overige inkomsten' : 'Algemeen';
			const behavior = c.tree === 'uitgaven' ? e.behavior : 'budget';
			const id = Number(
				insert.run(c.id, c.tree, name, behavior, behavior === 'pot' ? e.funding : null, 0, c.goal_cents, c.goal_date, c.start_month, c.id).lastInsertRowid
			);
			for (const table of ['splits', 'budgets', 'rules']) db.prepare(`UPDATE ${table} SET category_id = ? WHERE category_id = ?`).run(id, c.id);
		}

		db.prepare('UPDATE categories SET behavior = NULL, funding = NULL, goal_cents = NULL, goal_date = NULL WHERE id = ?').run(c.id);
	}
}
