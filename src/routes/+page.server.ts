import { redirect } from '@sveltejs/kit';
import { getSetting } from '$lib/server/db';
import { loadTree } from '$lib/server/categories';
import { Ledger, accountBalance, incomeSummary, rowsUnder, accounts, currentMonth, lastBookingDate, monthEnd, monthRows, openCounts, plannedTotal } from '$lib/server/reports';
import { openRefunds } from '$lib/server/refunds';

export function load({ url }) {
	const last = lastBookingDate();
	// Een lege installatie begint met de introductie (eenmalig); bestaande installaties met boekingen niet.
	if (last === null && !getSetting('onboarded')) redirect(303, '/welkom');
	const month = url.searchParams.get('maand') ?? last?.slice(0, 7) ?? currentMonth();
	const tree = loadTree();
	const { uitgaven, inkomsten } = new Ledger(tree).month(month);

	// Saldi aan het eind van de gekozen maand, of op de laatst bekende dag als die eerder is.
	const end = monthEnd(month);
	const balanceDate = last && last < end ? last : end;
	const accts = accounts().map((a) => ({ ...a, balance: accountBalance(a.id, balanceDate) }));
	const savings = accts.filter((a) => a.kind === 'spaar');

	return {
		month,
		hasData: last !== null,
		startdatum: getSetting('startdatum'),
		balanceDate,
		accounts: accts,
		income: incomeSummary(inkomsten, month),
		totals: {
			inkomsten: inkomsten.flow,
			uitgaven: -uitgaven.flow || 0,
			inlegActual: uitgaven.inlegActual,
			planned: plannedTotal(uitgaven),
			pots: uitgaven.pot,
			potsSpaar: uitgaven.potSpaar
		},
		savingsTotal: savings.reduce((s, a) => s + (a.balance ?? 0), 0),
		hasSavings: savings.length > 0,
		open: openCounts(month),
		refunds: openRefunds().reduce((t, e) => ({ n: t.n + 1, cents: t.cents + e.expected - e.received }), { n: 0, cents: 0 }),
		rows: monthRows(uitgaven),
		incomeRoot: { ...inkomsten, children: [] },
		incomeRows: rowsUnder(inkomsten)
	};
}
