import { db } from '$lib/server/db';
import { isOpenSql } from '$lib/server/reports';

export function load() {
	const { n } = db
		.prepare(`SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE ${isOpenSql()}`)
		.get() as { n: number };
	return { openCount: n };
}
