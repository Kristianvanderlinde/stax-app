import { db } from '$lib/server/db';
import { isOpenSql } from '$lib/server/reports';
import { groupHues as groupHues_ } from '$lib/server/hues';

export function load() {
	const { n } = db
		.prepare(`SELECT COUNT(*) AS n FROM transactions t JOIN accounts a ON a.id = t.account_id WHERE ${isOpenSql()}`)
		.get() as { n: number };
	const groupHues = groupHues_();
	return { openCount: n, groupHues };
}
