import { json } from '@sveltejs/kit';
import { link, unlink } from '$lib/server/refunds';
import { queryRows } from '$lib/server/bookings';

/** Een binnenkomende boeking als teruggave aan een uitgave koppelen ({ of: id }), of loskoppelen ({ of: null }). */
export async function POST({ params, request }) {
	const id = Number(params.id);
	const { of } = (await request.json().catch(() => ({}))) as { of?: number | null };
	if (!of) unlink(id);
	else {
		const problem = link(id, Number(of));
		if (problem) return json({ error: problem }, { status: 400 });
	}
	return json({ row: queryRows(['t.id = ?'], [id])[0] ?? null });
}
