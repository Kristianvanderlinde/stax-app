import { parseCamt, type ParsedStatement } from './camt';
import { parseCsvStatements, exampleCsv, NeedsInput, type CsvMapping, type CsvExample, type CsvPreview } from './csv';

// Eén ingang voor alle bankbestanden, voor web en app: het formaat wordt aan de inhoud herkend.

export interface BankFileOptions {
	/** Door de gebruiker gekozen kolommen (alleen CSV). */
	mapping?: CsvMapping;
	/** Eigen IBAN, als het bestand die niet bevat (alleen CSV). */
	iban?: string;
}

export type BankFormat = 'camt' | 'csv';

export function detectFormat(content: string): BankFormat {
	return content.replace(/^﻿/, '').trimStart().startsWith('<') ? 'camt' : 'csv';
}

/** Leest een bankbestand (camt.053-XML of CSV). Gooit NeedsInput als bij een CSV nog kolommen gekozen moeten worden. */
export function parseBankFile(content: string, options: BankFileOptions = {}): ParsedStatement[] {
	if (detectFormat(content) === 'camt') return parseCamt(content);
	return parseCsvStatements(content, options);
}

export interface ExampleResult {
	total: number;
	examples: CsvExample[];
	/** Nog te kiezen: kolommen of de rekening. */
	needs?: CsvPreview;
	error?: string;
}

/** De eerste boekingen zoals ze ingelezen zouden worden, zonder iets op te slaan. */
export function exampleBankFile(content: string, options: BankFileOptions = {}): ExampleResult {
	try {
		if (detectFormat(content) === 'camt') {
			const all = parseCamt(content).flatMap((s) => s.entries);
			return { total: all.length, examples: all.slice(0, 4).map((e) => ({ date: e.bookingDate, amountCents: e.amountCents, counterparty: e.counterparty, description: e.description })) };
		}
		return exampleCsv(content, options);
	} catch (e) {
		if (e instanceof NeedsInput) return { total: 0, examples: [], needs: e.preview, error: e.message };
		return { total: 0, examples: [], error: (e as Error).message };
	}
}
