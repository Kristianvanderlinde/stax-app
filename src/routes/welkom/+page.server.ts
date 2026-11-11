import { redirect } from '@sveltejs/kit';
import { db, setSetting } from '$lib/server/db';

export function load() {
	const n = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
	return {
		bookings: n('SELECT COUNT(*) AS n FROM transactions'),
		budgets: n('SELECT COUNT(*) AS n FROM categories WHERE parent_id IS NOT NULL AND archived = 0')
	};
}

export const actions = {
	// Klaar of overgeslagen: de introductie komt niet meer vanzelf terug (wel via Instellingen).
	klaar() {
		setSetting('onboarded', '1');
		redirect(303, '/');
	}
};
