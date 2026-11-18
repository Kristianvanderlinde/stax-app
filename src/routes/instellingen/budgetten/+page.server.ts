import { fail } from '@sveltejs/kit';
import { MapError, createGroup, createMap, deleteMap, mapInputFromForm, placeMap, updateMap } from '$lib/server/maps';
import { db } from '$lib/server/db';
import { isGroup, loadTree, toOptions } from '$lib/server/categories';
import { Budgets } from '$lib/server/budgets';
import { currentMonth } from '$lib/server/reports';
import { kindOf, type CatNode } from '$lib/types';
import type { EditNode } from '$lib/components/MapEditor.svelte';

// De enige plek om budgetten en groepen in te stellen: aanmaken, naam, icoon, opties, groep, volgorde en verwijderen.
// Het bedrag per maand hoort bij de planning en pas je aan in het budgetoverzicht of op de detailpagina.

export function load({ url }) {
	const tree = loadTree();
	const bookings = new Map(
		(db.prepare('SELECT category_id AS id, COUNT(*) AS n FROM splits GROUP BY category_id').all() as { id: number; n: number }[]).map((r) => [r.id, r.n])
	);
	const item = (n: CatNode) => ({ id: n.id, name: n.name, icon: n.effIcon, kind: kindOf(n), bookings: bookings.get(n.id) ?? 0 });
	const groups = tree.roots.uitgaven.children.map((g) => ({ ...item(g), budgets: g.children.map(item) }));
	const income = tree.roots.inkomsten.children.map(item);

	// ?bewerk=<id> opent het zijpaneel voor dat budget of die groep.
	const editId = Number(url.searchParams.get('bewerk'));
	const node = editId ? tree.byId.get(editId) : undefined;
	const edit: EditNode | null =
		node && node.depth > 0
			? {
					id: node.id,
					name: node.name,
					tree: node.tree,
					depth: node.depth,
					parent_id: node.parent_id,
					behavior: node.behavior,
					kind: kindOf(node),
					inherited: 'budget',
					funding: node.funding,
					effFunding: node.effFunding,
					icon: node.icon,
					effIcon: node.effIcon,
					color: node.color,
					goal_cents: node.goal_cents,
					goal_date: node.goal_date,
					bookings: bookings.get(node.id) ?? 0,
					childCount: node.children.length,
					descendants: [node.id, ...node.children.map((c) => c.id)],
					ownBudget: new Budgets().amount(node.id, currentMonth()),
					group: isGroup(node)
				}
			: null;

	return { groups, income, edit, options: toOptions(tree), roots: { uitgaven: tree.roots.uitgaven.id, inkomsten: tree.roots.inkomsten.id } };
}

function attempt<T>(fn: () => T) {
	try {
		return fn();
	} catch (e) {
		if (e instanceof MapError) return fail(400, { error: e.message });
		throw e;
	}
}

export const actions = {
	/** Nieuw budget in een groep (of bij inkomsten). */
	nieuw: async ({ request }) => {
		const form = await request.formData();
		return attempt(() => ({ created: createMap(Number(form.get('parent_id')), String(form.get('name') ?? ''), String(form.get('kind') ?? '') || null) }));
	},
	/** Nieuwe, lege groep bij de uitgaven. */
	groep: async ({ request }) => {
		const form = await request.formData();
		return attempt(() => ({ created: createGroup(String(form.get('name') ?? '')) }));
	},
	/** Vanuit het zijpaneel: naam, icoon, opties en groep. */
	opslaan: async ({ request }) => {
		const form = await request.formData();
		return attempt(() => {
			updateMap(Number(form.get('id')), mapInputFromForm(form));
			return { saved: true };
		});
	},
	/** Budget of lege groep weg. */
	verwijderen: async ({ request }) => {
		const form = await request.formData();
		return attempt(() => {
			deleteMap(Number(form.get('id')));
			return { removed: true };
		});
	},
	/** Na slepen: nieuwe groep en plek. */
	plaats: async ({ request }) => {
		const form = await request.formData();
		return attempt(() => {
			placeMap(Number(form.get('id')), Number(form.get('parent_id')), Number(form.get('before_id')) || null);
			return { moved: true };
		});
	}
};
