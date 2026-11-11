import type { ParsedEntry, ParsedStatement } from './camt';

// Leest CSV-exports van banken. Kolommen worden herkend aan hun naam (ING, Rabobank, bunq en andere
// banken gebruiken dezelfde soort namen); lukt dat niet, dan wijst de gebruiker de kolommen zelf aan.
// Alleen gewone TypeScript, zodat dit ook in de app (JavaScriptCore) draait.

/** Wat een kolom betekent. */
export const ROLES = ['date', 'amount', 'direction', 'debit', 'credit', 'counterparty', 'counterpartyIban', 'description', 'iban', 'balance', 'ref'] as const;
export type Role = (typeof ROLES)[number];

/** Rol → kolomnummer (0-gebaseerd). */
export type CsvMapping = Partial<Record<Role, number>> & { delimiter?: string };

export interface CsvPreview {
	headers: string[];
	/** De eerste paar rijen, om bij het kiezen van kolommen te laten zien. */
	sample: string[][];
	delimiter: string;
	/** Wat automatisch is herkend. */
	mapping: CsvMapping;
	/** Is er een IBAN-kolom? Zo niet, dan moet de gebruiker de rekening opgeven. */
	needsIban: boolean;
	/** Ontbreekt er nog iets verplichts (datum, bedrag)? */
	missing: Role[];
}

/** Het bestand is leesbaar als CSV, maar er is nog een keuze van de gebruiker nodig. */
export class NeedsInput extends Error {
	constructor(public preview: CsvPreview) {
		super('Kies welke kolommen datum, bedrag en omschrijving zijn.');
	}
}

const SYNONYMS: Record<Role, string[]> = {
	date: ['datum', 'boekingsdatum', 'transactiedatum', 'date', 'booking date', 'boekdatum', 'valutadatum'],
	amount: ['bedrag', 'bedrag (eur)', 'amount', 'transactiebedrag', 'bedrag eur'],
	direction: ['af bij', 'af/bij', 'debet/credit', 'debit/credit', 'cd'],
	debit: ['af', 'debet', 'debit'],
	credit: ['bij', 'credit'],
	counterparty: ['naam / omschrijving', 'naam tegenpartij', 'naam', 'tegenpartij', 'counterparty', 'name', 'begunstigde', 'omschrijving-1 naam'],
	counterpartyIban: ['tegenrekening', 'tegenrekening iban/bban', 'tegenrekening iban', 'counterparty iban', 'iban tegenpartij'],
	description: ['mededelingen', 'omschrijving', 'omschrijving-1', 'description', 'betalingskenmerk', 'details'],
	iban: ['rekening', 'iban/bban', 'iban', 'rekeningnummer', 'account', 'eigen rekening'],
	balance: ['saldo na mutatie', 'saldo na trn', 'saldo', 'balance'],
	ref: ['volgnr', 'volgnummer', 'referentie', 'id', 'transactie id']
};

/** Splitst CSV in rijen; ondersteunt aanhalingstekens, dubbele aanhalingstekens en regeleinden in velden. */
export function parseCsv(text: string, delimiter: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (quoted) {
			if (c === '"') {
				if (s[i + 1] === '"') {
					field += '"';
					i++;
				} else quoted = false;
			} else field += c;
		} else if (c === '"') quoted = true;
		else if (c === delimiter) {
			row.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && s[i + 1] === '\n') i++;
			row.push(field);
			field = '';
			if (row.some((f) => f.trim() !== '')) rows.push(row);
			row = [];
		} else field += c;
	}
	row.push(field);
	if (row.some((f) => f.trim() !== '')) rows.push(row);
	return rows;
}

/** Het scheidingsteken is het teken dat in de kopregel het vaakst voorkomt (buiten aanhalingstekens). */
export function detectDelimiter(text: string): string {
	const head = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
	let best = ',';
	let bestCount = 0;
	for (const d of [';', ',', '\t', '|']) {
		let n = 0;
		let q = false;
		for (const c of head) {
			if (c === '"') q = !q;
			else if (c === d && !q) n++;
		}
		if (n > bestCount) {
			best = d;
			bestCount = n;
		}
	}
	return best;
}

const norm = (h: string) => h.trim().toLowerCase().replace(/\s+/g, ' ');

/** Herkent kolommen aan hun naam. Een kolom krijgt maar één rol; een exacte naam gaat voor. */
export function guessMapping(headers: string[], rows: string[][] = []): CsvMapping {
	const mapping: CsvMapping = {};
	const used = new Set<number>();
	for (const role of ROLES) {
		const names = SYNONYMS[role];
		const at = headers.findIndex((h, i) => !used.has(i) && names.includes(norm(h)));
		if (at >= 0) {
			mapping[role] = at;
			used.add(at);
		}
	}
	// Daarna op woorden in de kopnaam: "Naam rekeninghouder", "Omschrijving 2", "Tekst".
	for (const [role, words] of KEYWORDS) {
		if (mapping[role] != null) continue;
		const at = headers.findIndex((h, i) => !used.has(i) && words.some((w) => norm(h).includes(w)));
		if (at >= 0) {
			mapping[role] = at;
			used.add(at);
		}
	}
	guessFromValues(mapping, used, headers.length, rows);
	return mapping;
}

/** Vult aan wat de kopnamen niet verraden, door naar de waarden te kijken (maximaal de eerste 30 rijen). */
function guessFromValues(mapping: CsvMapping, used: Set<number>, width: number, allRows: string[][]) {
	const rows = allRows.slice(0, 30);
	if (rows.length === 0) return;
	const values = (c: number) => rows.map((r) => (r[c] ?? '').trim()).filter(Boolean);
	const share = (c: number, test: (v: string) => boolean) => {
		const v = values(c);
		return v.length === 0 ? 0 : v.filter(test).length / v.length;
	};
	const free = () => Array.from({ length: width }, (_, i) => i).filter((i) => !used.has(i));
	const take = (role: Role, col: number | undefined) => {
		if (col == null || mapping[role] != null) return;
		mapping[role] = col;
		used.add(col);
	};

	if (mapping.date == null) take('date', free().find((c) => share(c, (v) => v.length >= 6 && parseDate(v) != null) >= 0.8));
	if (mapping.amount == null && !(mapping.debit != null && mapping.credit != null)) {
		// Bedragen hebben een decimaalteken; dat scheidt ze van nummers, jaartallen en codes.
		take('amount', free().find((c) => share(c, (v) => parseAmount(v) != null && /[.,]\d{1,2}$/.test(v)) >= 0.8));
	}
	if (mapping.iban == null || mapping.counterpartyIban == null) {
		for (const c of free().filter((c) => share(c, (v) => looksLikeIban(cleanIban(v))) >= 0.8)) {
			// Eén vast IBAN in elke rij is de eigen rekening, wisselende IBAN's zijn de tegenpartijen.
			const own = new Set(values(c).map(cleanIban)).size === 1;
			if (own) take('iban', c);
			else take('counterpartyIban', c);
		}
	}
	// Tekstkolommen: de kortste is meestal de naam, de langste de omschrijving.
	const text = free()
		// Een kolom die overal hetzelfde zegt (zoals de valuta, EUR) vertelt niets over de boeking.
		.filter((c) => values(c).length > 0 && (rows.length < 2 || new Set(values(c)).size > 1) && share(c, (v) => parseAmount(v) == null && parseDate(v) == null) >= 0.8)
		.map((c) => ({ c, len: values(c).reduce((n, v) => n + v.length, 0) / values(c).length }))
		.sort((a, b) => a.len - b.len);
	if (mapping.counterparty == null && mapping.description == null && text.length >= 2) {
		take('counterparty', text[0].c);
		take('description', text[text.length - 1].c);
	} else if (mapping.counterparty == null && text.length >= 1 && mapping.description != null) take('counterparty', text[0].c);
	else if (mapping.description == null && text.length >= 1 && mapping.counterparty != null) take('description', text[text.length - 1].c);
	else if (mapping.counterparty == null && mapping.description == null && text.length === 1) take('counterparty', text[0].c);
}

const KEYWORDS: [Role, string[]][] = [
	['counterparty', ['naam', 'name', 'wie', 'tegenpartij', 'begunstigde', 'payee', 'merchant', 'relatie']],
	['description', ['omschrijving', 'mededeling', 'description', 'tekst', 'betreft', 'memo', 'toelichting', 'verwendungszweck', 'details']]
];

const REQUIRED: Role[] = ['date'];

function missingRoles(m: CsvMapping): Role[] {
	const missing: Role[] = REQUIRED.filter((r) => m[r] == null);
	const hasAmount = m.amount != null || (m.debit != null && m.credit != null);
	if (!hasAmount) missing.push('amount');
	return missing;
}

/** Bedrag uit tekst: "1.234,56", "1,234.56", "-12,50", "+3,00", "€ 4,00". Geeft null als er geen bedrag staat. */
export function parseAmount(raw: string): number | null {
	let s = raw.replace(/[€\s ]/g, '');
	if (!s) return null;
	let sign = 1;
	if (/^\(.*\)$/.test(s)) {
		sign = -1;
		s = s.slice(1, -1);
	}
	if (s.startsWith('-')) {
		sign = -sign;
		s = s.slice(1);
	} else if (s.startsWith('+')) s = s.slice(1);
	if (s.endsWith('-')) {
		sign = -sign;
		s = s.slice(0, -1);
	}
	if (!/^[\d.,]+$/.test(s)) return null;
	// Het decimaalteken is het laatste punt of de laatste komma, als er één of twee cijfers achter staan en
	// het niet als duizendtalteken herhaald wordt. "1.234" is dus 1234 en "1.234,5" is 1234,50.
	const lastComma = s.lastIndexOf(',');
	const lastDot = s.lastIndexOf('.');
	const decimalAt = Math.max(lastComma, lastDot);
	let whole = s;
	let frac = '';
	if (decimalAt >= 0) {
		const sep = s[decimalAt];
		const after = s.length - decimalAt - 1;
		const other = sep === ',' ? '.' : ',';
		const repeated = s.split(sep).length > 2;
		if (!repeated && after >= 1 && after <= 2 && !(s.includes(other) && s.lastIndexOf(other) > decimalAt)) {
			whole = s.slice(0, decimalAt);
			frac = s.slice(decimalAt + 1);
		}
	}
	whole = whole.replace(/[.,]/g, '');
	if (!whole && !frac) return null;
	return sign * (Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2)));
}

/** Datum als YYYY-MM-DD uit "20260619", "2026-06-19", "19-06-2026", "19/06/2026" of "19-06-26". */
export function parseDate(raw: string): string | null {
	const s = raw.trim().slice(0, 10);
	let m = /^(\d{4})(\d{2})(\d{2})$/.exec(s) ?? /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
	if (m) return valid(m[1], m[2], m[3]);
	m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
	if (m) return valid(m[3], m[2], m[1]);
	m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/.exec(raw.trim());
	if (m) return valid(String(2000 + Number(m[3])), m[2], m[1]);
	return null;
}

function valid(y: string, mo: string, d: string): string | null {
	const month = Number(mo);
	const day = Number(d);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();
const cleanIban = (s: string) => s.replace(/\s+/g, '').toUpperCase();
const looksLikeIban = (s: string) => /^[A-Z]{2}\d{2}[A-Z0-9]{8,30}$/.test(s);

/** Kijkt in een CSV-bestand: kopregel, voorbeeldrijen en wat al herkend is. */
export function previewCsv(text: string, mapping?: CsvMapping): CsvPreview {
	const delimiter = mapping?.delimiter ?? detectDelimiter(text);
	const rows = parseCsv(text, delimiter);
	if (rows.length < 2) throw new Error('Dit bestand heeft geen boekingen.');
	const headers = rows[0].map((h) => h.trim());
	const { delimiter: _, ...given } = mapping ?? {};
	const guessed: CsvMapping = mapping ? given : guessMapping(headers, rows.slice(1));
	return {
		headers,
		sample: rows.slice(1, 6),
		delimiter,
		mapping: guessed,
		needsIban: guessed.iban == null,
		missing: missingRoles(guessed)
	};
}

export interface CsvOptions {
	mapping?: CsvMapping;
	/** Eigen IBAN, als het bestand die niet bevat. */
	iban?: string;
}

/** Is dit bestand (waarschijnlijk) CSV met een kopregel? */
export function looksLikeCsv(text: string): boolean {
	const head = text.replace(/^﻿/, '').split(/\r?\n/, 1)[0] ?? '';
	return !head.trimStart().startsWith('<') && /[;,\t|]/.test(head);
}

/**
 * Zet een CSV om naar afschriften (één per rekening). Gooit NeedsInput als kolommen of rekening
 * nog gekozen moeten worden. Een boeking die in twee exports voorkomt krijgt dezelfde bankRef, zodat
 * overlappende bestanden geen dubbele boekingen geven; identieke boekingen op één dag worden genummerd.
 */
export function parseCsvStatements(text: string, options: CsvOptions = {}): ParsedStatement[] {
	const preview = previewCsv(text, options.mapping);
	const m = preview.mapping;
	if (preview.missing.length > 0) throw new NeedsInput(preview);
	const fallbackIban = options.iban ? cleanIban(options.iban) : null;
	if (m.iban == null && !(fallbackIban && looksLikeIban(fallbackIban))) throw new NeedsInput(preview);

	const rows = parseCsv(text, preview.delimiter).slice(1);
	const cell = (r: string[], role: Role) => (m[role] != null ? (r[m[role]!] ?? '').trim() : '');
	const byIban = new Map<string, ParsedEntry[]>();
	const seen = new Map<string, number>();
	const lastBalance = new Map<string, { date: string; cents: number }>();

	for (const r of rows) {
		const bookingDate = parseDate(cell(r, 'date'));
		if (!bookingDate) continue;

		let amount: number | null;
		if (m.amount != null) {
			amount = parseAmount(cell(r, 'amount'));
			const dir = norm(cell(r, 'direction'));
			// ING: bedrag staat zonder teken, "Af" of "Bij" zegt de richting.
			if (amount != null && m.direction != null) {
				if (/^(af|d|debet|debit|dbit)/.test(dir)) amount = -Math.abs(amount);
				else if (/^(bij|c|credit|crdt)/.test(dir)) amount = Math.abs(amount);
			}
		} else {
			const out = parseAmount(cell(r, 'debit'));
			const inn = parseAmount(cell(r, 'credit'));
			amount = inn ? Math.abs(inn) : out ? -Math.abs(out) : null;
		}
		if (amount == null) continue;

		const iban = m.iban != null ? cleanIban(cell(r, 'iban')) : fallbackIban!;
		if (!looksLikeIban(iban)) continue;

		const counterparty = squash(cell(r, 'counterparty'));
		const counterpartyIban = cleanIban(cell(r, 'counterpartyIban'));
		const description = squash(cell(r, 'description'));
		const explicitRef = cell(r, 'ref');
		let bankRef: string;
		if (explicitRef) bankRef = `csv|${bookingDate}|${explicitRef}`;
		else {
			const key = `csv|${bookingDate}|${amount}|${counterpartyIban}|${counterparty}|${description}`;
			const n = seen.get(iban + key) ?? 0;
			seen.set(iban + key, n + 1);
			bankRef = `${key}|${n}`;
		}

		const list = byIban.get(iban) ?? [];
		list.push({
			bankRef,
			bookingDate,
			amountCents: amount,
			counterparty: counterparty || null,
			counterpartyIban: looksLikeIban(counterpartyIban) ? counterpartyIban : null,
			description,
			rawInfo: squash([counterparty, description].filter(Boolean).join(' ')),
			bankCode: null,
			mcc: null
		});
		byIban.set(iban, list);

		const bal = m.balance != null ? parseAmount(cell(r, 'balance')) : null;
		if (bal != null) {
			const prev = lastBalance.get(iban);
			// Exports staan meestal nieuwste eerst; het saldo van de recentste boeking is het eindsaldo.
			if (!prev || bookingDate >= prev.date) lastBalance.set(iban, { date: bookingDate, cents: bal });
		}
	}

	if (byIban.size === 0) throw new Error('Geen boekingen gevonden. Controleer of de kolommen kloppen.');
	return [...byIban].map(([iban, entries]) => {
		const closing = lastBalance.get(iban);
		return {
			iban,
			openingCents: null,
			openingDate: null,
			closingCents: closing?.cents ?? null,
			closingDate: closing?.date ?? null,
			entries
		};
	});
}

export interface CsvExample {
	date: string;
	amountCents: number;
	counterparty: string | null;
	description: string;
}

/** De eerste boekingen zoals ze ingelezen worden, zonder iets op te slaan. Gooit NeedsInput of een fout als het (nog) niet klopt. */
export function exampleCsv(text: string, options: CsvOptions = {}): { total: number; examples: CsvExample[] } {
	// Het eigen IBAN doet voor het voorbeeld niet mee; een nette plaatsvervanger voorkomt dat het daar op vastloopt.
	const preview = previewCsv(text, options.mapping);
	const iban = preview.mapping.iban == null && !options.iban ? 'NL00STAX0000000000' : options.iban;
	const statements = parseCsvStatements(text, { mapping: options.mapping ?? preview.mapping, iban });
	const all = statements.flatMap((s) => s.entries);
	return {
		total: all.length,
		examples: all.slice(0, 4).map((e) => ({ date: e.bookingDate, amountCents: e.amountCents, counterparty: e.counterparty, description: e.description }))
	};
}
