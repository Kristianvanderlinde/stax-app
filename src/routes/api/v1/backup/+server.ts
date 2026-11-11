import { error, json } from '@sveltejs/kit';
import { BackupError, exportBackup, importBackup } from '$lib/server/backup';

/** De hele back-up als JSON. */
export function GET() {
	return json(exportBackup());
}

/** Zet een back-up terug; vervangt alle gegevens. Body = het back-upbestand. */
export async function POST({ request }) {
	const b = await request.json().catch(() => null);
	try {
		return json({ ok: true, ...importBackup(b) });
	} catch (e) {
		if (e instanceof BackupError) error(400, e.message);
		throw e;
	}
}
