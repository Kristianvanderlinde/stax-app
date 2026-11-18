import { db, tx } from './db';
import { loadTree } from './categories';
import { currentMonth } from './reports';
import { parseMoney } from '$lib/format';
import { CATEGORY_ICONS } from '$lib/material-icons';
import { isHue } from '$lib/hue';
import type { Behavior, Funding } from '$lib/types';

// Budgetten en groepen aanmaken, bewerken, ordenen en verwijderen. Alleen vanuit Instellingen → Budgetten.

type Row = { id: number; parent_id: number | null; tree: string; opening_cents: number; behavior: Behavior | null; color: string | null };

function get(id: number) {
	return db.prepare('SELECT id, parent_id, tree, opening_cents, behavior, color FROM categories WHERE id = ?').get(id) as Row | undefined;
}

export class MapError extends Error {}

/** Heeft dit budget zelf iets: boekingen, een maandbedrag, regels of een startsaldo? */
function hasOwnData(id: number): boolean {
	return (
		!!db.prepare('SELECT 1 FROM splits WHERE category_id = ? LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM budgets WHERE category_id = ? AND amount_cents != 0 LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM rules WHERE category_id = ? LIMIT 1').get(id) ||
		!!db.prepare('SELECT 1 FROM categories WHERE id = ? AND (opening_cents != 0 OR goal_cents IS NOT NULL)').get(id)
	);
}

const hasChildren = (id: number) => !!db.prepare('SELECT 1 FROM categories WHERE parent_id = ? AND archived = 0 LIMIT 1').get(id);

// Twee niveaus: bij uitgaven staan groepen op het hoogste niveau en budgetten in een groep; inkomsten
// zijn budgetten direct op het hoogste niveau.
const isRoot = (r: Row | undefined) => !!r && r.parent_id == null;
const isGroupRow = (r: Row | undefined) => !!r && r.tree === 'uitgaven' && isRoot(get(r.parent_id ?? -1));

/** Waar een budget mag staan: in een groep (uitgaven) of direct onder de wortel (inkomsten). */
function checkBudgetParent(parent: Row | undefined, tree: string) {
	if (!parent || parent.tree !== tree) throw new MapError('Kies in welke groep het budget komt.');
	if (tree === 'uitgaven' ? !isGroupRow(parent) : !isRoot(parent)) throw new MapError('Een budget staat altijd direct in een groep.');
}

const nextSort = (parentId: number) => (db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS s FROM categories WHERE parent_id = ?').get(parentId) as { s: number }).s;

/** Nieuw budget in een groep (of bij inkomsten); geeft het id terug. */
export function createMap(parentId: number, name: string, kind: string | null = null): number {
	const parent = get(parentId);
	name = name.trim();
	if (!name) throw new MapError('Geef het nieuwe budget een naam.');
	checkBudgetParent(parent, parent?.tree ?? '');
	const behavior: Behavior = kind === 'spaarpot' || kind === 'doelpot' ? 'pot' : 'budget';
	return Number(
		db
			.prepare('INSERT INTO categories (parent_id, tree, name, behavior, sort, start_month) VALUES (?, ?, ?, ?, ?, ?)')
			.run(parent!.id, parent!.tree, name, behavior, nextSort(parent!.id), currentMonth()).lastInsertRowid
	);
}

/** Nieuwe, lege groep bij de uitgaven; geeft het id terug. */
export function createGroup(name: string): number {
	name = name.trim();
	if (!name) throw new MapError('Geef de nieuwe groep een naam.');
	const root = loadTree().roots.uitgaven;
	return Number(
		db.prepare("INSERT INTO categories (parent_id, tree, name, sort) VALUES (?, 'uitgaven', ?, ?)").run(root.id, name, nextSort(root.id)).lastInsertRowid
	);
}

/**
 * Zet een budget of groep op een nieuwe plek: onder parentId, vóór beforeId (of achteraan als die leeg is).
 * Een budget kan zo ook naar een andere groep; een groep blijft op het hoogste niveau.
 */
export function placeMap(id: number, parentId: number, beforeId: number | null) {
	const self = get(id);
	const parent = get(parentId);
	if (!self || self.parent_id == null) throw new MapError('Dit budget kan niet verplaatst worden.');
	if (isGroupRow(self)) {
		if (parentId !== self.parent_id) throw new MapError('Een groep staat altijd op het hoogste niveau.');
	} else checkBudgetParent(parent, self.tree);
	const siblings = (db.prepare('SELECT id FROM categories WHERE parent_id = ? AND archived = 0 AND id != ? ORDER BY sort, name').all(parentId, id) as { id: number }[]).map(
		(r) => r.id
	);
	const at = beforeId != null ? siblings.indexOf(beforeId) : -1;
	siblings.splice(at < 0 ? siblings.length : at, 0, id);
	tx(() => {
		db.prepare('UPDATE categories SET parent_id = ? WHERE id = ?').run(parentId, id);
		siblings.forEach((s, k) => db.prepare('UPDATE categories SET sort = ? WHERE id = ?').run(k, s));
	});
}

/** Wat er van een budget of groep te bewerken valt. Alles wordt in één keer vastgelegd, ook wat leeg is. */
export interface MapInput {
	name: string;
	/** Eigen icoon; leeg = hetzelfde als de groep. */
	icon: string;
	/** Kleur van een groep; leeg = automatisch. */
	color?: string;
	/** 'budget', 'spaarpot' of 'doelpot'. */
	kind: string;
	funding: string;
	/** Doelbedrag in centen, alleen bij een doelpot. */
	goalCents: number | null;
	/** Jaar ("2027"), maand ("2027-03") of dag ("2027-03-15"). */
	goalDate: string;
	/** Nieuwe groep voor een budget. */
	parentId: number | null;
}

/** Leest het formulier van de website. */
export function mapInputFromForm(form: FormData): MapInput {
	return {
		name: String(form.get('name') ?? ''),
		icon: String(form.get('icon') ?? ''),
		color: String(form.get('color') ?? ''),
		kind: String(form.get('kind') ?? ''),
		funding: String(form.get('funding') ?? ''),
		goalCents: parseMoney(String(form.get('goal') ?? '')),
		goalDate: String(form.get('goal_date') ?? ''),
		parentId: Number(form.get('parent_id')) || null
	};
}

/** Naam, icoon, soort, geldplek, doel en groep bijwerken. */
export function updateMap(id: number, input: MapInput) {
	const node = get(id);
	if (!node || node.parent_id == null) throw new MapError('Budget niet gevonden.');
	const name = input.name.trim();
	if (!name) throw new MapError('Een budget heeft een naam nodig.');

	// Doel- en spaarpot zijn allebei 'pot'; alleen een doelpot bewaart een doel. Een groep heeft geen soort.
	const group = isGroupRow(node);
	const kind = group || node.tree !== 'uitgaven' ? '' : input.kind;
	const behavior: Behavior | null = group ? null : kind === 'spaarpot' || kind === 'doelpot' ? 'pot' : 'budget';
	const f = input.funding;
	const funding: Funding | null = behavior === 'pot' && (f === 'spaar' || f === 'betaal') ? f : null;
	const icon = CATEGORY_ICONS.includes(input.icon) ? input.icon : null;
	// Zonder kleur in de invoer (bijv. de iOS-app) blijft de gekozen kleur staan.
	const color = !group ? null : input.color === undefined ? node.color : isHue(input.color) ? input.color : null;
	const goal = kind === 'doelpot' ? input.goalCents || null : null;
	if (kind === 'doelpot' && !goal) throw new MapError('Een doel heeft een doelbedrag nodig.');
	const rawDate = input.goalDate;
	// Een doel kan op een jaar ("2027"), een maand ("2027-03") of een dag ("2027-03-15") staan.
	const goalDate = goal && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(rawDate) ? rawDate : null;

	// Een budget kan naar een andere groep; achteraan in die groep.
	let parentId = node.parent_id;
	let sort: number | null = null;
	const wanted = input.parentId;
	if (!group && wanted && wanted !== node.parent_id) {
		checkBudgetParent(get(wanted), node.tree);
		parentId = wanted;
		sort = nextSort(wanted);
	}

	// Een andere soort begint deze maand; daar rekent het schema van een doelpot vanaf.
	const restart = behavior !== node.behavior;
	db.prepare(
		`UPDATE categories SET name = ?, behavior = ?, funding = ?, icon = ?, color = ?, goal_cents = ?, goal_date = ?, parent_id = ?, sort = COALESCE(?, sort),
		 start_month = CASE WHEN ? THEN ? ELSE start_month END WHERE id = ?`
	).run(name, behavior, funding, icon, color, goal, goalDate, parentId, sort, restart ? 1 : 0, currentMonth(), node.id);
}

/**
 * Verwijdert een budget of een lege groep. De boekingen van een budget moet je daarna opnieuw indelen.
 * Een groep met budgetten erin kan niet weg: verplaats of verwijder eerst de budgetten.
 */
export function deleteMap(id: number): number {
	const node = get(id);
	if (!node || node.parent_id == null) throw new MapError('Dit budget kan niet weg.');
	if (hasChildren(id)) throw new MapError('Deze groep heeft nog budgetten. Verplaats of verwijder die eerst.');
	tx(() => {
		db.prepare('DELETE FROM splits WHERE category_id = ?').run(id);
		db.prepare('DELETE FROM rules WHERE category_id = ?').run(id);
		db.prepare('DELETE FROM budgets WHERE category_id = ?').run(id);
		db.prepare('DELETE FROM categories WHERE id = ?').run(id);
	});
	return node.parent_id;
}

