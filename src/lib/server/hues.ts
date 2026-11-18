import { db } from './db';
import { HUES, isHue } from '$lib/hue';

/**
 * Kleur per categorie: een groep heeft zijn eigen keuze of anders een kleur op volgorde, een budget erft die van zijn groep,
 * inkomsten zijn groen. Eén regel voor website en app.
 */
export function hueMap(): Map<number, string> {
	const rows = db.prepare('SELECT id, parent_id, tree, color FROM categories WHERE archived = 0 ORDER BY sort, id').all() as {
		id: number;
		parent_id: number | null;
		tree: string;
		color: string | null;
	}[];
	const out = new Map<number, string>();
	const roots = new Set(rows.filter((r) => r.parent_id == null).map((r) => r.id));
	let i = 0;
	for (const r of rows) {
		if (r.parent_id == null) out.set(r.id, 'accent');
		else if (roots.has(r.parent_id)) out.set(r.id, r.tree === 'inkomsten' ? 'mint' : isHue(r.color) ? r.color : HUES[i++ % HUES.length]);
	}
	for (const r of rows) if (!out.has(r.id)) out.set(r.id, out.get(r.parent_id ?? -1) ?? 'accent');
	return out;
}

/** Kleur per groep (alleen de groepen van uitgaven), voor de layout van de website. */
export function groupHues(): Record<number, string> {
	const all = hueMap();
	const groups = db
		.prepare("SELECT c.id FROM categories c JOIN categories p ON p.id = c.parent_id WHERE c.tree = 'uitgaven' AND p.parent_id IS NULL AND c.archived = 0")
		.all() as { id: number }[];
	return Object.fromEntries(groups.map((g) => [g.id, all.get(g.id) ?? 'accent']));
}
