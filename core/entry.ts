import { ROUTES } from './dist/routes.gen';
import { HttpError, type Reply } from './shims/kit';
import { SearchParams } from './searchparams';

// Eén ingang voor de app: dezelfde API als de server, maar in-process. De app roept
// Core.handle(methode, pad, query, body) aan en krijgt { status, body } terug.

type Handler = (event: unknown) => Reply | Promise<Reply>;

function match(path: string): { mod: Record<string, Handler>; params: Record<string, string> } | null {
	const parts = path.split('/').filter(Boolean);
	// Net als SvelteKit: een vaste segmentnaam (budgetten/volgorde) wint van een parameter (budgetten/[id]).
	let best: { mod: Record<string, Handler>; params: Record<string, string>; fixed: number } | null = null;
	for (const r of ROUTES) {
		if (r.segments.length !== parts.length) continue;
		const params: Record<string, string> = {};
		let fixed = 0;
		const ok = r.segments.every((seg, i) => {
			const m = /^\[(.+)\]$/.exec(seg);
			if (m) {
				params[m[1]] = decodeURIComponent(parts[i]);
				return true;
			}
			if (seg === parts[i]) fixed++;
			return seg === parts[i];
		});
		if (ok && (!best || fixed > best.fixed)) best = { mod: r.mod as unknown as Record<string, Handler>, params, fixed };
	}
	return best;
}

export async function handle(method: string, path: string, query: string, body: string | null): Promise<Reply> {
	const found = match(path);
	if (!found) return { status: 404, body: JSON.stringify({ message: 'Niet gevonden' }) };
	const fn = found.mod[method.toUpperCase()];
	if (!fn) return { status: 405, body: JSON.stringify({ message: 'Methode niet toegestaan' }) };
	const event = {
		params: found.params,
		url: { searchParams: new SearchParams(query) },
		request: { json: async () => JSON.parse(body ?? 'null') }
	};
	try {
		return await fn(event);
	} catch (e) {
		if (e instanceof HttpError) return { status: e.status, body: JSON.stringify(e.body) };
		return { status: 500, body: JSON.stringify({ message: 'Internal Error' }) };
	}
}
