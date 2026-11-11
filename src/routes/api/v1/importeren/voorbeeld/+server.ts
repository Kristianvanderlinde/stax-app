import { error, json } from '@sveltejs/kit';
import { exampleBankFile } from '$lib/server/bankfile';
import type { CsvMapping } from '$lib/server/csv';

/** { content, mapping?, iban? }: de eerste boekingen zoals ze ingelezen zouden worden, zonder iets op te slaan. */
export async function POST({ request }) {
	const b = await request.json().catch(() => null);
	if (typeof b?.content !== 'string') error(400, 'Geef de inhoud van het bestand mee.');
	return json(
		exampleBankFile(b.content, {
			mapping: b.mapping && typeof b.mapping === 'object' ? (b.mapping as CsvMapping) : undefined,
			iban: typeof b.iban === 'string' ? b.iban : undefined
		})
	);
}
