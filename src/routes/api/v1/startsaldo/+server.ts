import { json } from '@sveltejs/kit';
import { saveStart, startData } from '$lib/server/instellingen';

export function GET({ url }) {
	return json(startData(url.searchParams.get('datum')));
}

/** { startdatum, income_pot, openings: { "<pot-id>": centen } } */
export async function PUT({ request }) {
	const b = await request.json().catch(() => null);
	const openings: Record<string, number> = {};
	for (const [id, v] of Object.entries((b?.openings ?? {}) as Record<string, unknown>)) if (Number.isInteger(v)) openings[id] = v as number;
	const problem = saveStart(String(b?.startdatum ?? ''), Number.isInteger(b?.income_pot) ? b.income_pot : null, openings);
	if (problem) return json({ error: problem }, { status: 400 });
	return json({ ok: true });
}
