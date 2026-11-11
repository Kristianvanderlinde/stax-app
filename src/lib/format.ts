const number = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Bedrag zonder euroteken: "1.234,56", "−12,34". Met signed ook een plus: "+12,34".
 * Voor lijsten, waar het euroteken alleen onrustig maakt.
 */
export function amount(cents: number | null | undefined, signed = false): string {
	if (cents == null) return '';
	const sign = cents < 0 ? '−' : signed && cents > 0 ? '+' : '';
	return sign + number.format(Math.abs(cents) / 100);
}

/** Bedrag met euroteken, dan een spatie en eventueel het teken: "€ 1.234,56", "€ −12,34". Voor prominente bedragen. */
export function money(cents: number | null | undefined, signed = false): string {
	if (cents == null) return '';
	return '€\u00a0' + amount(cents, signed);
}

/** Bedrag voor in een invoerveld: 1234,5 → "1234,50". */
export function moneyInput(cents: number | null | undefined): string {
	if (cents == null) return '';
	return (cents / 100).toFixed(2).replace('.', ',');
}

/** Leest "1.234,56", "1234.56", "€ 12" of "-5" als centen. Leeg of ongeldig → null. */
export function parseMoney(input: string | null | undefined): number | null {
	if (input == null) return null;
	let s = String(input).replace(/[€\s]/g, '');
	if (!s) return null;
	if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
	const n = Number(s);
	return Number.isFinite(n) ? Math.round(n * 100) : null;
}

const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];

export function monthName(month: string, withYear = true): string {
	const [y, m] = month.split('-').map(Number);
	const name = MONTHS[m - 1];
	return withYear ? `${name} ${y}` : name;
}

/** "in 2027", "in maart 2027" of "op 15 maart 2027", afhankelijk van hoe precies het doel is. */
export function goalDateText(goalDate: string): string {
	if (goalDate.length === 4) return `in ${goalDate}`;
	if (goalDate.length === 7) return `in ${monthName(goalDate)}`;
	return `op ${new Date(goalDate + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
}

export function dayLabel(date: string): string {
	const d = new Date(date + 'T12:00:00');
	return d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function shortDate(date: string): string {
	const d = new Date(date + 'T12:00:00');
	return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
}
