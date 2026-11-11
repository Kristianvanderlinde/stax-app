import { amount as money } from './format';
import { kindOf, type Kind, type NodeStats } from './types';

export interface Figures {
	kind: Kind | 'inkomsten';
	/** Budget: maandbedrag. Pot: wat er deze maand in ging. Inkomsten: verwacht bedrag. */
	budgeted: number | null;
	/** Bij een pot: wat er volgens plan in had moeten gaan. */
	planned: number | null;
	/** Wat er deze maand gepland is: het budget, of bij een pot de geplande inleg. */
	plan: number | null;
	/** Alles wat er deze maand in en uit ging, netto: inleg en terugbetalingen min uitgaven. */
	net: number;
	/** Netto uitgegeven deze maand (terugbetalingen eraf); bij inkomsten: ontvangen. */
	spent: number;
	/** Budget: wat er over is. Pot: saldo. */
	balance: number | null;
	bar: { pct: number; over: boolean; text: string; warn: boolean } | null;
}

/** De cijfers van één map in één maand, zoals het startscherm en de detailpagina ze tonen. */
export function figures(n: NodeStats): Figures {
	// Een groep telt de budgetten eronder op.
	if (n.children.length) {
		const parts = n.children.map((c) => figures(c));
		const sum = (k: 'plan' | 'net' | 'spent' | 'balance') => parts.reduce((s, f) => s + (f[k] ?? 0), 0);
		const plan = sum('plan');
		const income = n.tree === 'inkomsten';
		return { kind: income ? 'inkomsten' : 'budget', budgeted: plan, planned: null, plan, net: sum('net'), spent: sum('spent'), balance: income ? null : sum('balance'), bar: null };
	}
	const flow = n.flow;
	if (n.tree === 'inkomsten') {
		return { kind: 'inkomsten', budgeted: n.monthly, planned: null, plan: n.monthly, net: flow, spent: flow, balance: null, bar: null };
	}
	const kind: Kind = kindOf(n);
	const spent = flow === 0 ? 0 : -flow;

	if (kind === 'budget') {
		const budgeted = n.monthly;
		// Zonder budget is alles wat je uitgeeft meteen een tekort.
		const balance = (budgeted ?? 0) - spent;
		const bar = budgeted
			? { pct: (Math.max(0, spent) / budgeted) * 100, over: spent > budgeted, text: `${Math.round((Math.max(0, spent) / budgeted) * 100)}% op`, warn: false }
			: null;
		return { kind, budgeted, planned: null, plan: budgeted, net: flow, spent, balance, bar };
	}

	const inleg = n.inlegActual;
	const planned = n.inlegPlanned || null;
	const balance = n.pot;
	let bar: Figures['bar'] = null;
	if (kind === 'doelpot' && n.goal) {
		const behind = n.goal.expected != null ? n.goal.expected - balance : null;
		bar = {
			pct: n.goal.progress * 100,
			over: false,
			warn: behind != null && behind > 0,
			text: `${Math.round(n.goal.progress * 100)}% van ${money(n.goal.target)}${behind != null ? (behind > 0 ? ` · ${money(behind)} achter` : ' · op schema') : ''}`
		};
	} else if (planned) {
		bar = { pct: (inleg / planned) * 100, over: false, warn: false, text: `${money(inleg)} van ${money(planned)} ingelegd` };
	}
	return { kind, budgeted: inleg || null, planned, plan: planned, net: inleg + flow, spent, balance, bar };
}
