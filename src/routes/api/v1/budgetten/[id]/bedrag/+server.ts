import { error, json } from '@sveltejs/kit';
import { setBudget } from '$lib/server/budgets';
import { isBudgetId, loadTree } from '$lib/server/categories';

/**
 * Het maandbedrag van een budget: { month, amount_cents, scope: 'vanaf' | 'alleen' }.
 * Zonder amount_cents (null) bij 'alleen' vervalt de afwijking van die maand.
 */
export async function PUT({ params, request }) {
	const b = await request.json().catch(() => null);
	const id = Number(params.id);
	if (!b || typeof b.month !== 'string' || !/^\d{4}-\d{2}$/.test(b.month)) error(400, 'Ongeldige maand.');
	const scope = b.scope === 'alleen' ? 'alleen' : 'vanaf';
	const amount = b.amount_cents == null ? null : b.amount_cents;
	if (amount !== null && (!Number.isInteger(amount) || amount < 0)) error(400, 'Vul een geldig bedrag in.');
	if (amount === null && scope !== 'alleen') error(400, 'Vul een bedrag in.');
	if (!isBudgetId(loadTree(), id)) return json({ error: 'Een groep heeft geen eigen budget; het totaal komt van de budgetten eronder.' }, { status: 400 });
	setBudget(id, b.month, amount, scope);
	return json({ ok: true });
}
