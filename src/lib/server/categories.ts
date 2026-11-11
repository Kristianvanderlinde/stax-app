import { db } from './db';
import { kindOf, type CatNode, type CatOption, type Category, type Tree } from '$lib/types';

export interface CategoryTree {
	roots: Record<Tree, CatNode>;
	byId: Map<number, CatNode>;
	/** Alle knopen in boomvolgorde (ouder vóór kinderen). */
	flat: CatNode[];
}

export function loadTree(includeArchived = false): CategoryTree {
	const rows = db
		.prepare(`SELECT * FROM categories ${includeArchived ? '' : 'WHERE archived = 0'} ORDER BY sort, name`)
		.all() as unknown as Category[];
	const byId = new Map<number, CatNode>();
	for (const r of rows) byId.set(r.id, { ...r, children: [], depth: 0, path: [], effective: 'budget', effFunding: 'spaar', effIcon: null });

	const roots = {} as Record<Tree, CatNode>;
	for (const node of byId.values()) {
		const parent = node.parent_id != null ? byId.get(node.parent_id) : undefined;
		if (parent) parent.children.push(node);
		else if (node.parent_id == null) roots[node.tree] = node;
	}

	const flat: CatNode[] = [];
	function walk(node: CatNode, depth: number, path: string[], parent: CatNode | null) {
		node.depth = depth;
		node.path = path;
		// Elk budget heeft zijn eigen soort; een groep is alleen een optelsom.
		node.effective = groupAt(node, depth) ? 'budget' : (node.behavior ?? 'budget');
		node.effFunding = node.funding ?? 'spaar';
		node.effIcon = node.icon ?? parent?.effIcon ?? null;
		flat.push(node);
		const childPath = depth === 0 ? [] : [...path, node.name];
		for (const c of node.children) walk(c, depth + 1, childPath, node);
	}
	for (const tree of ['uitgaven', 'inkomsten'] as Tree[]) if (roots[tree]) walk(roots[tree], 0, [], null);

	return { roots, byId, flat };
}

export function fullName(node: CatNode): string {
	return node.depth === 0 ? `${node.name} (algemeen)` : [...node.path, node.name].join(' › ');
}

export function toOptions(tree: CategoryTree): CatOption[] {
	return tree.flat.map((n) => ({
		id: n.id,
		tree: n.tree,
		name: n.name,
		label: fullName(n),
		depth: n.depth,
		isGroup: isGroup(n),
		effective: n.effective,
		effFunding: n.effFunding,
		kind: kindOf(n),
		savings: holdsSavings(n),
		parent: n.parent_id,
		icon: n.depth === 0 ? 'folder' : n.effIcon,
		group: n.depth === 0 ? '' : (n.path[0] ?? n.name)
	}));
}

/**
 * Volgorde om op de detailpagina door te bladeren: zoals in het budgetoverzicht, eerst uitgaven en dan inkomsten.
 * Met groups alleen de groepen, anders alleen de budgetten.
 */
export function browseOrder(tree: CategoryTree, groups = false): CatNode[] {
	return tree.flat.filter((n) => n.depth > 0 && isGroup(n) === groups);
}

/** Id's van een knoop en al zijn nakomelingen. */
export function subtreeIds(node: CatNode): number[] {
	const ids: number[] = [];
	const walk = (n: CatNode) => {
		ids.push(n.id);
		n.children.forEach(walk);
	};
	walk(node);
	return ids;
}

/**
 * Twee niveaus: bij uitgaven is alles op het hoogste niveau een groep, met budgetten erin; inkomsten zijn
 * alleen budgetten. Een groep telt alleen op en kan zelf geen boekingen of budget hebben. Ook een lege groep
 * is een groep. (De wortel van een boom telt ook als groep.)
 */
function groupAt(n: { tree: Tree; children: unknown[] }, depth: number): boolean {
	return depth === 0 || (n.tree === 'uitgaven' && depth === 1) || n.children.length > 0;
}

export function isGroup(n: CatNode): boolean {
	return groupAt(n, n.depth);
}

/** Een budget waar boekingen, regels en bedragen bij kunnen: alles wat geen groep is. */
export function isBudgetId(tree: CategoryTree, id: number): boolean {
	const n = tree.byId.get(id);
	return !!n && !isGroup(n);
}

/** Een spaarpot waarvan het geld op de spaarrekening staat; alleen daar kan inleg in. */
export function isSavingsPot(n: CatNode): boolean {
	return !isGroup(n) && n.tree === 'uitgaven' && n.effective === 'pot' && n.effFunding === 'spaar';
}

/** Mag spaargeld bevatten. */
export function holdsSavings(n: CatNode): boolean {
	return isSavingsPot(n);
}

const STOPWORDS = new Set(['overig', 'overige', 'en', 'de', 'het', 'van', 'voor', '&', '-']);

function words(s: string): string[] {
	return s
		.toLowerCase()
		.split(/[^a-z0-9à-ÿ]+/)
		.filter((w) => w && !STOPWORDS.has(w));
}

/**
 * Zoekt een spaarpot waarvan de naam in de omschrijving van een overboeking staat.
 * Alle woorden van de potnaam moeten voorkomen; woorden van bovenliggende mappen tellen als
 * bonus. Zo wint "Auto › Onderhoud" van "Onderhoud huis" bij de omschrijving "Auto onderhoud".
 */
export function matchPotByName(tree: CategoryTree, description: string): CatNode | null {
	const desc = new Set(words(description));
	if (desc.size === 0) return null;
	let best: CatNode | null = null;
	let bestScore = 0;
	let tie = false;
	for (const node of tree.flat) {
		if (!holdsSavings(node)) continue;
		const own = words(node.name);
		if (own.length === 0) continue;
		// Een woord mag ook deel zijn van een samenstelling ("verzekering" in "woonverzekering"),
		// maar een exacte match telt zwaarder.
		const partial = (w: string) => [...desc].some((d) => d.length > 4 && w.length > 4 && (d.includes(w) || w.includes(d)));
		if (!own.every((w) => desc.has(w) || partial(w))) continue;
		const score =
			own.reduce((s, w) => s + (desc.has(w) ? 3 : 1), 0) + node.path.flatMap(words).filter((w) => desc.has(w)).length;
		if (score > bestScore) {
			best = node;
			bestScore = score;
			tie = false;
		} else if (score === bestScore) tie = true;
	}
	return tie ? null : best;
}
