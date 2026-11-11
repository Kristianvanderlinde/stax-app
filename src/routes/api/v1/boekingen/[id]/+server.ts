import { json } from '@sveltejs/kit';
import { classify, queryRows } from '$lib/server/bookings';
import type { Split } from '$lib/types';

/** Eén boeking indelen: delen, uit de pot of niet, notitie, niet meetellen, teruggave en regel leren. */
export async function POST({ params, request }) {
	const id = Number(params.id);
	const body = (await request.json().catch(() => null)) as {
		splits?: Split[];
		fromPot?: boolean;
		note?: string;
		excluded?: boolean;
		refund?: number | null;
		remember?: boolean;
	} | null;
	if (!body || !Array.isArray(body.splits)) return json({ error: 'Ongeldige indeling.' }, { status: 400 });
	const result = classify(id, {
		splits: body.splits.map((s) => ({ category_id: Number(s.category_id), amount_cents: Math.round(Number(s.amount_cents)) })),
		fromPot: body.fromPot === false ? 0 : 1,
		note: String(body.note ?? ''),
		excluded: !!body.excluded,
		refund: body.refund == null ? null : Number(body.refund),
		remember: !!body.remember
	});
	if ('error' in result) return json({ error: result.error }, { status: result.status });
	return json({ applied: result.applied, row: queryRows(['t.id = ?'], [id])[0] ?? null });
}
