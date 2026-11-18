import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { accountBalance, accounts, lastBookingDate } from '$lib/server/reports';

export function load() {
	const balanceDate = lastBookingDate() ?? new Date().toISOString().slice(0, 10);
	return { balanceDate, accounts: accounts().map((a) => ({ ...a, balance: accountBalance(a.id, balanceDate) })) };
}

export const actions = {
	default: async ({ request }) => {
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const kind = form.get('kind') === 'spaar' ? 'spaar' : 'betaal';
		if (!name) return fail(400, { error: 'Geef de rekening een naam.' });
		db.prepare('UPDATE accounts SET name = ?, kind = ? WHERE id = ?').run(name, kind, Number(form.get('id')));
		return { ok: true };
	}
};
