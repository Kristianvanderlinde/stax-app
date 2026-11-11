import { error, json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { importFiles } from '$lib/server/importer';
import type { CsvMapping } from '$lib/server/csv';

export function GET() {
	const imports = db
		.prepare(
			`SELECT i.id, i.filename, i.imported_at, i.n_total, i.n_new, a.name AS account
			 FROM imports i JOIN accounts a ON a.id = i.account_id ORDER BY i.id DESC LIMIT 20`
		)
		.all();
	return json({ imports });
}

/**
 * { files: [{ name, content, mapping?, iban? }] } met camt.053-XML of CSV. Geeft per bestand terug wat er is toegevoegd;
 * bij een CSV waarvan de kolommen niet herkend zijn komt `needs` terug, en stuur je het bestand opnieuw met `mapping`/`iban`.
 */
export async function POST({ request }) {
	const b = await request.json().catch(() => null);
	const files = Array.isArray(b?.files) ? b.files.filter((f: { name?: unknown; content?: unknown }) => typeof f?.name === 'string' && typeof f?.content === 'string') : [];
	if (files.length === 0) error(400, 'Kies eerst een of meer bestanden (XML of CSV).');
	return json(
		importFiles(
			files.map((f: { name: string; content: string; mapping?: unknown; iban?: unknown }) => ({
				name: f.name,
				content: f.content,
				mapping: f.mapping && typeof f.mapping === 'object' ? (f.mapping as CsvMapping) : undefined,
				iban: typeof f.iban === 'string' ? f.iban : undefined
			}))
		)
	);
}
