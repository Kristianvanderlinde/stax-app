// Draait de app-kern in Node zoals JavaScriptCore dat zou doen (zonder URL, Buffer, process, …) en
// vergelijkt de antwoorden met een draaiende server. Gebruik: node core/harness.mjs <db> <serverUrl> <token>
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, rmSync } from 'node:fs';

const [dbFile, server, token] = process.argv.slice(2);
// Werk op een kopie, zodat de testdatabase zelf niet verandert.
const copy = `${process.env.TMPDIR ?? '/tmp'}/core-harness.db`;
rmSync(copy, { force: true });
// VACUUM INTO neemt ook de nog niet weggeschreven wijzigingen (WAL) van een draaiende server mee.
new DatabaseSync(dbFile).exec(`VACUUM INTO '${copy}'`);
const real = new DatabaseSync(copy);

globalThis.__stax = {
	exec: (sql) => real.exec(sql),
	query: (sql, p) => JSON.stringify(real.prepare(sql).all(...JSON.parse(p))),
	run: (sql, p) => {
		const r = real.prepare(sql).run(...JSON.parse(p));
		return JSON.stringify({ changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) });
	}
};

const paths = [
	['GET', 'overzicht', ''],
	['GET', 'overzicht', 'maand=2026-06'],
	['GET', 'rekeningen', ''],
	['GET', 'spaarpotten', ''],
	['GET', 'regels', ''],
	['GET', 'boekingen', 'status=alle'],
	['GET', 'startsaldo', ''],
	['GET', 'budgetten/3', 'maand=2026-11'],
	['GET', 'budgetten/7', ''],
	['GET', 'budgetten/99999', '']
];
const bundle = readFileSync(new URL('../ios/Stax/Core/core.js', import.meta.url), 'utf8');

// Eerst de serverantwoorden ophalen: fetch heeft Buffer nodig, dat we hierna weghalen.
const theirs = [];
for (const [, path, q] of paths) {
	const res = await fetch(`${server}/api/v1/${path}${q ? '?' + q : ''}`, { headers: { Authorization: `Bearer ${token}` } });
	theirs.push({ status: res.status, text: await res.text() });
}

// Zoals JavaScriptCore: deze bestaan daar niet.
const missing = ['URL', 'URLSearchParams', 'Buffer', 'process', 'TextDecoder', 'TextEncoder', 'structuredClone', 'setTimeout', 'setInterval', 'Response', 'Request', 'fetch', 'queueMicrotask'];
const saved = {};
for (const k of missing) {
	saved[k] = globalThis[k];
	try { delete globalThis[k]; } catch {}
	if (k in globalThis) Object.defineProperty(globalThis, k, { value: undefined, configurable: true, writable: true });
}
const Core = (0, eval)(bundle + '\n;Core');

let bad = 0;
for (const [i, [m, path, q]] of paths.entries()) {
	const mine = await Core.handle(m, path, q, null);
	const other = theirs[i];
	const same = mine.status === other.status && JSON.stringify(JSON.parse(mine.body)) === JSON.stringify(JSON.parse(other.text));
	if (!same) bad++;
	console.log(same ? 'GELIJK ' : 'VERSCHIL', m, path + (q ? '?' + q : ''), mine.status, other.status, `${mine.body.length}b`);
	if (!same) console.log('  mijn:', mine.body.slice(0, 300), '\n  server:', other.text.slice(0, 300));
}
// Alleen lokaal: schrijven in de eigen database, en fouten zoals de server ze geeft.
const tag = Math.floor(Math.random() * 90000 + 10000);
const csv = `Datum;Waarde;Wie;Tekst\n02-06-2026;-3,50;Koffiebar ${tag};latte\n03-06-2026;-12,00;Bakker ${tag};brood\n`;
const w = await Core.handle('POST', 'importeren', '', JSON.stringify({ files: [{ name: 'a.csv', content: csv, iban: 'NL91 ABNA 0417 1643 00' }] }));
const wr = JSON.parse(w.body);
const again = JSON.parse((await Core.handle('POST', 'importeren', '', JSON.stringify({ files: [{ name: 'a.csv', content: csv, iban: 'NL91 ABNA 0417 1643 00' }] }))).body);
console.log(w.status === 200 && wr.results[0].added === 2 && again.results[0].added === 0 ? 'GELIJK  importeren (2 nieuw, daarna 0)' : 'FOUT    importeren ' + w.body);
const bad400 = await Core.handle('POST', 'importeren', '', JSON.stringify({ files: [] }));
console.log(bad400.status === 400 ? 'GELIJK  fout 400: ' + bad400.body : 'FOUT    ' + bad400.status);
const nf = await Core.handle('GET', 'bestaatniet', '', null);
console.log(nf.status === 404 ? 'GELIJK  404' : 'FOUT 404');
console.log(bad ? `${bad} verschillen` : 'Alles gelijk');
saved.process.exit(bad ? 1 : 0);
