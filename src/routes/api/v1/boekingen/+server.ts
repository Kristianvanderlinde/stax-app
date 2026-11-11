import { json } from '@sveltejs/kit';
import { toOptions } from '$lib/server/categories';
import { accounts } from '$lib/server/reports';
import { filtersFrom, listBookings } from '$lib/server/bookings';

/** Boekingen met dezelfde filters als de website (status, maand, q, rekening, map, van), plus de budgetkeuze. */
export function GET({ url }) {
	const { tree, ...data } = listBookings(filtersFrom(url.searchParams));
	const options = toOptions(tree).map((o) => ({
		id: o.id,
		tree: o.tree,
		name: o.name,
		label: o.label,
		depth: o.depth,
		parent: o.parent,
		group: o.isGroup,
		kind: o.kind,
		savings: o.savings,
		icon: o.icon
	}));
	return json({ ...data, options, accounts: accounts().map((a) => ({ id: a.id, name: a.name, kind: a.kind })) });
}
