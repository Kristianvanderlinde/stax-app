import { loadTree } from '$lib/server/categories';
import { getSetting } from '$lib/server/db';
import { Ledger, accountBalance, accounts, currentMonth, lastBookingDate, monthEnd } from '$lib/server/reports';
import type { NodeStats } from '$lib/types';

// Altijd de actuele stand: de maand van de laatste boeking. Per pot kun je op de detailpagina door de maanden.
export function load() {
	const last = lastBookingDate();
	const month = last?.slice(0, 7) ?? currentMonth();
	const ledger = new Ledger(loadTree());
	const { uitgaven } = ledger.month(month);

	const end = monthEnd(month);
	const balanceDate = last && last < end ? last : end;
	const savingsTotal = accounts()
		.filter((a) => a.kind === 'spaar')
		.reduce((s, a) => s + (accountBalance(a.id, balanceDate) ?? 0), 0);

	// Per groep de spaarpotten erin, ook als ze dieper in een subgroep staan. Een spaarpot zonder groep staat los.
	const groups = uitgaven.children
		.filter((g) => g.hasPot)
		.map((g) => {
			const pots: { node: NodeStats; path: string }[] = [];
			const walk = (n: NodeStats, path: string[]) => {
				if (n.isPot) pots.push({ node: n, path: path.join(' › ') });
				n.children.forEach((c) => walk(c, n === g ? [] : [...path, n.name]));
			};
			walk(g, []);
			return { group: g, pots };
		});

	return { month, balanceDate, groups, total: uitgaven.pot, totalSpaar: uitgaven.potSpaar, savingsTotal, hasSavings: accounts().some((a) => a.kind === 'spaar'), savingsId: accounts().find((a) => a.kind === 'spaar')?.id ?? '' };
}
