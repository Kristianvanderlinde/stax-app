// Verse installatie: de kern maakt zelf een lege database aan (migraties + standaardbudgetten).
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync } from 'node:fs';
const file = `${process.env.TMPDIR ?? '/tmp'}/core-empty.db`;
rmSync(file, { force: true });
const real = new DatabaseSync(file);
globalThis.__stax = {
	exec: (sql) => real.exec(sql),
	query: (sql, p) => JSON.stringify(real.prepare(sql).all(...JSON.parse(p))),
	run: (sql, p) => {
		const r = real.prepare(sql).run(...JSON.parse(p));
		return JSON.stringify({ changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) });
	}
};
const Core = (0, eval)(readFileSync(new URL('../ios/Stax/Core/core.js', import.meta.url), 'utf8') + '\n;Core');
const o = await Core.handle('GET', 'overzicht', '', null);
const b = await Core.handle('GET', 'budgetten', '', null);
console.log('overzicht', o.status, o.body.slice(0, 120));
console.log('budgetten', b.status, JSON.parse(b.body).groups?.length ?? Object.keys(JSON.parse(b.body)));
console.log('user_version', real.prepare('PRAGMA user_version').get());
// Een vaste route moet winnen van [id]: budgetten/volgorde mag niet als budget "volgorde" gelezen worden.
const v = await Core.handle('GET', 'budgetten/volgorde', '', null);
if (v.status !== 200) throw new Error(`budgetten/volgorde gaf ${v.status}: ${v.body}`);
console.log('volgorde', v.status);
