// Vervangt node:sqlite in de app. De echte database zit aan de Swift-kant; alleen deze drie aanroepen
// gaan over de brug, met JSON voor parameters en rijen.
declare const __stax: {
	exec(sql: string): void;
	query(sql: string, params: string): string;
	run(sql: string, params: string): string;
};

type Param = string | number | bigint | null | undefined | boolean;
const pack = (p: Param[]) => JSON.stringify(p.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : typeof v === 'bigint' ? Number(v) : v === undefined ? null : v)));

export class StatementSync {
	constructor(private sql: string) {}
	all(...p: Param[]): Record<string, unknown>[] {
		return JSON.parse(__stax.query(this.sql, pack(p)));
	}
	get(...p: Param[]): Record<string, unknown> | undefined {
		return this.all(...p)[0];
	}
	run(...p: Param[]): { changes: number; lastInsertRowid: number } {
		return JSON.parse(__stax.run(this.sql, pack(p)));
	}
}

export class DatabaseSync {
	constructor(_path?: string) {}
	exec(sql: string) {
		__stax.exec(sql);
	}
	prepare(sql: string) {
		return new StatementSync(sql);
	}
}
