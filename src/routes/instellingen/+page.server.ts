import { db, getSetting } from '$lib/server/db';
import { accounts } from '$lib/server/reports';

export function load() {
	const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
	return {
		accounts: accounts().length,
		rules: count("SELECT COUNT(*) AS n FROM rules WHERE field != 'mcc'"),
		budgets: count('SELECT COUNT(*) AS n FROM categories WHERE parent_id IS NOT NULL AND archived = 0'),
		startdatum: getSetting('startdatum')
	};
}
