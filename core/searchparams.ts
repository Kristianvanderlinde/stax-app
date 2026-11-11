// JavaScriptCore heeft geen URLSearchParams; dit dekt wat de handlers gebruiken.
export class SearchParams {
	private pairs: [string, string][] = [];
	constructor(query = '') {
		for (const part of query.replace(/^\?/, '').split('&')) {
			if (!part) continue;
			const [k, v = ''] = part.split('=');
			this.pairs.push([dec(k), dec(v)]);
		}
	}
	get(key: string): string | null {
		return this.pairs.find(([k]) => k === key)?.[1] ?? null;
	}
	getAll(key: string): string[] {
		return this.pairs.filter(([k]) => k === key).map(([, v]) => v);
	}
	has(key: string): boolean {
		return this.pairs.some(([k]) => k === key);
	}
}
const dec = (s: string) => {
	try {
		return decodeURIComponent(s.replace(/\+/g, ' '));
	} catch {
		return s;
	}
};
