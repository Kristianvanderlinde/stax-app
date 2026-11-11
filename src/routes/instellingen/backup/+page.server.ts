import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { BackupError, importBackup } from '$lib/server/backup';

export function load() {
	const count = (sql: string) => (db.prepare(sql).get() as { n: number }).n;
	return { transactions: count('SELECT COUNT(*) AS n FROM transactions'), accounts: count('SELECT COUNT(*) AS n FROM accounts') };
}

export const actions = {
	terugzetten: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('bestand');
		if (!(file instanceof File) || !file.size) return fail(400, { error: 'Kies eerst een back-upbestand.' });
		if (form.get('akkoord') !== 'ja') return fail(400, { error: 'Zet het vinkje: bevestig dat je alles wilt vervangen.' });
		let json: unknown;
		try {
			json = JSON.parse(await file.text());
		} catch {
			return fail(400, { error: 'Dit is geen Stax-back-up.' });
		}
		try {
			return { restored: importBackup(json) };
		} catch (e) {
			if (e instanceof BackupError) return fail(400, { error: e.message });
			throw e;
		}
	}
};
