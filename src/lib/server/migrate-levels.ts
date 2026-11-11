import type { DatabaseSync } from 'node:sqlite';

// Migratie naar twee niveaus: bij uitgaven een groep met budgetten erin, bij inkomsten alleen budgetten.
// - Een groep in een groep (bijv. Vervoer › Auto) wordt een eigen groep, direct na de groep waar hij in stond.
//   Blijft die groep daardoor leeg achter, dan verdwijnt hij.
// - Een budget op het hoogste niveau van uitgaven gaat naar de groep "Overig".
// - Bij inkomsten komen alle budgetten op het hoogste niveau; groepen verdwijnen.
// Mag vaker draaien: een tweede keer verandert niets meer.

interface Cat {
	id: number;
	parent_id: number | null;
	tree: 'uitgaven' | 'inkomsten';
	name: string;
	sort: number;
	icon: string | null;
}

export function twoLevels(db: DatabaseSync) {
	const load = () => db.prepare('SELECT id, parent_id, tree, name, sort, icon FROM categories ORDER BY sort, name').all() as unknown as Cat[];
	const ownData = (id: number) =>
		!!db.prepare('SELECT 1 FROM splits WHERE category_id = ? LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM budgets WHERE category_id = ? AND amount_cents != 0 LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM rules WHERE category_id = ? LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM categories WHERE id = ? AND (opening_cents != 0 OR goal_cents IS NOT NULL)').get(id);
	const setParent = db.prepare('UPDATE categories SET parent_id = ?, sort = ? WHERE id = ?');
	const remove = (id: number) => {
		db.prepare('DELETE FROM budgets WHERE category_id = ?').run(id);
		db.prepare('DELETE FROM categories WHERE id = ?').run(id);
	};

	for (const tree of ['uitgaven', 'inkomsten'] as const) {
		const root = load().find((c) => c.tree === tree && c.parent_id == null);
		if (!root) continue;

		if (tree === 'uitgaven') {
			// Subgroepen naar boven halen, tot er nergens meer een groep in een groep staat. Ze komen in hun
			// oorspronkelijke volgorde direct na de groep waar ze in stonden.
			const promoted = new Map<number, number>();
			for (;;) {
				const cats = load();
				const byId = new Map(cats.map((c) => [c.id, c]));
				const kids = (id: number) => cats.filter((c) => c.parent_id === id);
				const depth = (c: Cat): number => (c.parent_id == null ? 0 : 1 + depth(byId.get(c.parent_id)!));
				// Ondiepste eerst, en binnen een groep op volgorde.
				const sub = cats
					.filter((c) => c.tree === tree && depth(c) >= 2 && kids(c.id).length > 0)
					.sort((a, b) => depth(a) - depth(b))[0];
				if (!sub) break;
				let top = byId.get(sub.parent_id!)!;
				while (top.parent_id !== root.id) top = byId.get(top.parent_id!)!;
				const left = byId.get(sub.parent_id!)!;
				// Een icoon dat hij van hoger erfde, krijgt hij nu zelf; anders raakt hij het kwijt.
				if (!sub.icon) {
					let up: Cat | undefined = left;
					while (up && !up.icon) up = up.parent_id != null ? byId.get(up.parent_id) : undefined;
					if (up?.icon) db.prepare('UPDATE categories SET icon = ? WHERE id = ?').run(up.icon, sub.id);
				}
				const done = promoted.get(top.id) ?? 0;
				promoted.set(top.id, done + 1);
				const order = kids(root.id).map((c) => c.id);
				order.splice(order.indexOf(top.id) + 1 + done, 0, sub.id);
				order.forEach((id, i) => setParent.run(root.id, i, id));
				// Een groep die zo leeg achterblijft en zelf niets heeft, is overbodig.
				if (left.id !== root.id && kids(left.id).filter((c) => c.id !== sub.id).length === 0 && !ownData(left.id)) remove(left.id);
			}

			// Losse budgetten op het hoogste niveau naar de groep Overig.
			const cats = load();
			const loose = cats.filter((c) => c.parent_id === root.id && !cats.some((k) => k.parent_id === c.id) && ownData(c.id));
			if (loose.length) {
				let overig = cats.find((c) => c.parent_id === root.id && c.name === 'Overig' && !loose.includes(c));
				if (!overig) {
					const id = Number(
						db.prepare("INSERT INTO categories (parent_id, tree, name, icon, sort) VALUES (?, 'uitgaven', 'Overig', 'more_horiz', 999)").run(root.id).lastInsertRowid
					);
					overig = { id, parent_id: root.id, tree: 'uitgaven', name: 'Overig', sort: 999, icon: 'more_horiz' };
				}
				const start = cats.filter((c) => c.parent_id === overig!.id).length;
				loose.forEach((c, i) => setParent.run(overig!.id, start + i, c.id));
			}
		} else {
			// Inkomsten: alles wat in een groep staat naar het hoogste niveau; de groepen zelf verdwijnen.
			for (;;) {
				const cats = load();
				const group = cats.find((c) => c.tree === tree && c.parent_id != null && cats.some((k) => k.parent_id === c.id));
				if (!group) break;
				const order = cats.filter((c) => c.parent_id === root.id).map((c) => c.id);
				const inner = cats.filter((c) => c.parent_id === group.id).map((c) => c.id);
				order.splice(order.indexOf(group.id) + 1, 0, ...inner);
				order.forEach((id, i) => setParent.run(root.id, i, id));
				if (!ownData(group.id)) remove(group.id);
			}
		}
	}

	// Groepen hebben geen soort, geldplek of doel.
	db.exec(`UPDATE categories SET behavior = NULL, funding = NULL, goal_cents = NULL, goal_date = NULL
		WHERE tree = 'uitgaven' AND parent_id IN (SELECT id FROM categories WHERE parent_id IS NULL)`);
}
