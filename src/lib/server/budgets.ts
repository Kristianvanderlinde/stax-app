import { db, tx } from './db';

// Budgetten per maand. Een 'vanaf'-bedrag is het sjabloon vanaf die maand; een 'alleen'-bedrag
// wijkt af voor één maand. Zo verandert een aanpassing in oktober niets aan juli.

export const BEGIN = '0000-00';

interface Entry {
	vanaf: [month: string, amount: number][];
	alleen: Map<string, number>;
}

export class Budgets {
	private byCat = new Map<number, Entry>();

	constructor() {
		const rows = db.prepare('SELECT category_id, month, scope, amount_cents FROM budgets ORDER BY month').all() as {
			category_id: number;
			month: string;
			scope: 'vanaf' | 'alleen';
			amount_cents: number;
		}[];
		for (const r of rows) {
			if (!this.byCat.has(r.category_id)) this.byCat.set(r.category_id, { vanaf: [], alleen: new Map() });
			const e = this.byCat.get(r.category_id)!;
			if (r.scope === 'vanaf') e.vanaf.push([r.month, r.amount_cents]);
			else e.alleen.set(r.month, r.amount_cents);
		}
	}

	/** Het sjabloonbedrag dat in een maand geldt, en sinds wanneer. */
	template(id: number, month: string): { amount: number; since: string } | null {
		const e = this.byCat.get(id);
		if (!e) return null;
		let hit: [string, number] | null = null;
		for (const v of e.vanaf) if (v[0] <= month) hit = v;
		return hit && hit[1] ? { amount: hit[1], since: hit[0] } : null;
	}

	/** Afwijking voor precies deze maand (0 = deze maand geen budget). */
	override(id: number, month: string): number | null {
		return this.byCat.get(id)?.alleen.get(month) ?? null;
	}

	/** Het bedrag dat in een maand geldt. */
	amount(id: number, month: string): number | null {
		const o = this.override(id, month);
		if (o !== null) return o || null;
		return this.template(id, month)?.amount ?? null;
	}

	hasAny(id: number): boolean {
		return (this.byCat.get(id)?.vanaf.length ?? 0) > 0;
	}
}

/**
 * Legt een budget vast. 'alleen': alleen deze maand (null = terug naar het sjabloon).
 * 'vanaf': nieuw sjabloon vanaf deze maand; latere sjabloonwijzigingen vervallen, losse
 * afwijkingen blijven staan. Het allereerste sjabloon geldt vanaf het begin.
 */
export function setBudget(categoryId: number, month: string, amount: number | null, scope: 'vanaf' | 'alleen') {
	tx(() => {
		if (scope === 'alleen') {
			db.prepare("DELETE FROM budgets WHERE category_id = ? AND month = ? AND scope = 'alleen'").run(categoryId, month);
			if (amount !== null) db.prepare("INSERT INTO budgets VALUES (?, ?, 'alleen', ?)").run(categoryId, month, amount);
			return;
		}
		const first = !(db.prepare("SELECT 1 FROM budgets WHERE category_id = ? AND scope = 'vanaf'").get(categoryId));
		const from = first ? BEGIN : month;
		db.prepare("DELETE FROM budgets WHERE category_id = ? AND scope = 'vanaf' AND month >= ?").run(categoryId, from);
		db.prepare("DELETE FROM budgets WHERE category_id = ? AND scope = 'alleen' AND month = ?").run(categoryId, month);
		db.prepare("INSERT INTO budgets VALUES (?, ?, 'vanaf', ?)").run(categoryId, from, amount ?? 0);
	});
}
