import { json } from '@sveltejs/kit';
import { closeExpected } from '$lib/server/refunds';
import { queryRows } from '$lib/server/bookings';

/** Niets meer terugverwachten voor een uitgave. */
export function POST({ params }) {
	const id = Number(params.id);
	closeExpected(id);
	return json({ row: queryRows(['t.id = ?'], [id])[0] ?? null });
}
