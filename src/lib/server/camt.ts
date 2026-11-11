import { XMLParser } from 'fast-xml-parser';

// Leest camt.053-afschriften (ISO 20022), zoals ASN en de meeste Nederlandse banken ze exporteren.

export interface ParsedEntry {
	bankRef: string;
	bookingDate: string;
	amountCents: number;
	counterparty: string | null;
	counterpartyIban: string | null;
	description: string;
	rawInfo: string;
	bankCode: string | null;
	mcc: string | null;
}

export interface ParsedStatement {
	iban: string;
	openingCents: number | null;
	openingDate: string | null;
	closingCents: number | null;
	closingDate: string | null;
	entries: ParsedEntry[];
}

const parser = new XMLParser({
	removeNSPrefix: true,
	ignoreAttributes: false,
	parseTagValue: false,
	trimValues: true,
	isArray: (name) => ['Stmt', 'Bal', 'Ntry', 'TxDtls', 'Ustrd'].includes(name)
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Node = any;

function text(v: Node): string | null {
	if (v == null) return null;
	if (typeof v === 'object') return v['#text'] != null ? String(v['#text']) : null;
	return String(v);
}

function cents(amount: Node, indicator: Node): number {
	const value = Math.round(parseFloat(text(amount) ?? '0') * 100);
	return text(indicator) === 'DBIT' ? -value : value;
}

function squash(s: string): string {
	return s.replace(/\s+/g, ' ').trim();
}

export function parseCamt(xml: string): ParsedStatement[] {
	const doc = parser.parse(xml);
	const statements: Node[] = doc?.Document?.BkToCstmrStmt?.Stmt;
	if (!statements) throw new Error('Dit is geen camt.053-bankafschrift.');

	return statements.map((st) => {
		const iban = text(st.Acct?.Id?.IBAN);
		if (!iban) throw new Error('Rekeningnummer ontbreekt in het afschrift.');

		const balance = (code: string) => (st.Bal ?? []).find((b: Node) => text(b.Tp?.CdOrPrtry?.Cd) === code);
		const opening = balance('OPBD') ?? balance('PRCD');
		const closing = balance('CLBD');

		const entries: ParsedEntry[] = [];
		for (const e of st.Ntry ?? []) {
			if (text(e.Sts) && text(e.Sts) !== 'BOOK') continue;
			const amountCents = cents(e.Amt, e.CdtDbtInd);
			const bookingDate = text(e.BookgDt?.Dt) ?? text(e.BookgDt?.DtTm)?.slice(0, 10);
			if (!bookingDate) continue;

			const details = e.NtryDtls?.TxDtls?.[0] ?? {};
			// Bij een afschrijving is de crediteur de tegenpartij, bij een bijschrijving de debiteur.
			const parties = details.RltdPties ?? {};
			const party = amountCents < 0 ? parties.Cdtr : parties.Dbtr;
			const partyAcct = amountCents < 0 ? parties.CdtrAcct : parties.DbtrAcct;
			const info = squash(text(e.AddtlNtryInf) ?? '');
			const family = text(e.BkTxCd?.Domn?.Fmly?.Cd);
			const sub = text(e.BkTxCd?.Domn?.Fmly?.SubFmlyCd);

			let counterparty = text(party?.Nm ?? party?.Pty?.Nm);
			let description = (details.RmtInf?.Ustrd ?? []).map(text).filter(Boolean).join(' ');
			if (!description) description = info.replace(/\s*Referentie:.*$/, '');

			// Pinbetalingen hebben geen tegenrekening; de winkelnaam staat vóór het '>'-teken.
			if (family === 'CCRD' && info.includes('>')) {
				counterparty = squash(info.split('>')[0]);
				const place = info.split('>')[1]?.match(/^[A-Za-z' -]+?(?=\s*\d|\s{2}|$)/)?.[0];
				description = place ? squash(place) : '';
			}

			entries.push({
				bankRef: text(e.NtryRef) ?? text(e.AcctSvcrRef) ?? `${bookingDate}|${amountCents}|${info}`,
				bookingDate,
				amountCents,
				counterparty: counterparty ? squash(counterparty) : null,
				counterpartyIban: text(partyAcct?.Id?.IBAN),
				description: squash(description),
				rawInfo: info,
				bankCode: family && sub ? `${family}/${sub}` : family,
				mcc: info.match(/MCC:(\d{4})/)?.[1] ?? null
			});
		}

		return {
			iban,
			openingCents: opening ? cents(opening.Amt, opening.CdtDbtInd) : null,
			openingDate: opening ? text(opening.Dt?.Dt) : null,
			closingCents: closing ? cents(closing.Amt, closing.CdtDbtInd) : null,
			closingDate: closing ? text(closing.Dt?.Dt) : null,
			entries
		};
	});
}
