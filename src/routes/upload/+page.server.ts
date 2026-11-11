import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { importFiles } from '$lib/server/importer';
import { exampleBankFile } from '$lib/server/bankfile';
import { ROLES, type CsvMapping } from '$lib/server/csv';

export function load() {
	const imports = db
		.prepare(
			`SELECT i.id, i.filename, i.imported_at, i.n_total, i.n_new, a.name AS account
			 FROM imports i JOIN accounts a ON a.id = i.account_id ORDER BY i.id DESC LIMIT 20`
		)
		.all() as { id: number; filename: string; imported_at: string; n_total: number; n_new: number; account: string }[];
	return { imports };
}

/** Per kolom (col_0, col_1, …) de gekozen betekenis. */
function mappingFrom(form: FormData): CsvMapping {
	const mapping: CsvMapping = { delimiter: String(form.get('delimiter') ?? ';') };
	for (const [key, value] of form.entries()) {
		const m = /^col_(\d+)$/.exec(key);
		if (m && (ROLES as readonly string[]).includes(String(value))) mapping[value as (typeof ROLES)[number]] = Number(m[1]);
	}
	return mapping;
}

export const actions = {
	/** Voorbeeld van het resultaat bij de gekozen kolommen, zonder op te slaan. */
	voorbeeld: async ({ request }) => {
		const form = await request.formData();
		return exampleBankFile(String(form.get('content') ?? ''), { mapping: mappingFrom(form), iban: String(form.get('iban') ?? '') });
	},
	inlezen: async ({ request }) => {
		const form = await request.formData();

		// Tweede stap bij een CSV: de gekozen kolommen en eventueel de rekening, samen met het bestand zelf.
		const retry = form.get('content');
		if (typeof retry === 'string') {
			const mapping = mappingFrom(form);
			const name = String(form.get('name') ?? 'bestand.csv');
			return { ...importFiles([{ name, content: retry, mapping, iban: String(form.get('iban') ?? '') }]), contents: { [name]: retry } };
		}

		const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
		if (files.length === 0) return fail(400, { error: 'Kies eerst een of meer bestanden (XML of CSV).' });
		const contents = await Promise.all(files.map(async (f) => ({ name: f.name, content: await f.text() })));
		// Bij een CSV die om keuzes vraagt, nemen we de inhoud mee terug zodat de tweede stap geen nieuwe upload nodig heeft.
		const out = importFiles(contents);
		return { ...out, contents: Object.fromEntries(contents.map((c) => [c.name, c.content])) };
	}
};
