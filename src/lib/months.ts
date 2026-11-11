/** Maandrekenen op "jjjj-mm", bruikbaar in browser én server. */
export function shiftMonth(month: string, delta: number): string {
	const [y, m] = month.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

/** Maand waarin een doel bereikt moet zijn. Bij alleen een jaar is dat december van dat jaar. */
export function goalMonthOf(goalDate: string): string {
	return goalDate.length === 4 ? `${goalDate}-12` : goalDate.slice(0, 7);
}
