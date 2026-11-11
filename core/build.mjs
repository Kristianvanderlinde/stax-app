// Bundelt de API-handlers van de server tot één script voor JavaScriptCore (de app).
// Het resultaat (ios/Stax/Core/core.js) wordt meegecommit, zodat de iOS-build niets extra's nodig heeft.
// Gebruik: node core/build.mjs [uitvoerbestand]
import { build } from 'esbuild';
import { readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative, resolve, dirname, sep } from 'node:path';

const root = resolve(dirname(new URL(import.meta.url).pathname), '..');
const api = join(root, 'src/routes/api/v1');
// Inloggen, apparaten en gebruikers bestaan alleen op de server.
const SKIP = new Set(['login', 'logout', 'account']);

function walk(dir, out = []) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (name === '+server.ts') out.push(p);
	}
	return out;
}

const routes = walk(api)
	.map((file) => ({ file, segments: relative(api, dirname(file)).split(sep).filter(Boolean) }))
	.filter((r) => !SKIP.has(r.segments[0]))
	// Vaste stukken gaan voor [id]: budgetten/volgorde vóór budgetten/[id].
	.sort((a, b) => a.segments.join('/').replace(/\[[^\]]+\]/g, '~').localeCompare(b.segments.join('/').replace(/\[[^\]]+\]/g, '~')));

const generated = join(root, 'core/dist/routes.gen.ts');
mkdirSync(dirname(generated), { recursive: true });
writeFileSync(
	generated,
	[
		...routes.map((r, i) => `import * as r${i} from ${JSON.stringify(r.file)};`),
		`export const ROUTES = [`,
		...routes.map((r, i) => `\t{ segments: ${JSON.stringify(r.segments)}, mod: r${i} },`),
		`];`
	].join('\n')
);

const outfile = resolve(process.argv[2] ?? join(root, 'ios/Stax/Core/core.js'));
await build({
	entryPoints: [join(root, 'core/entry.ts')],
	bundle: true,
	format: 'iife',
	globalName: 'Core',
	// 'browser': een node:-import die we vergeten te vervangen, laat de bundel mislukken in plaats van later in de app.
	platform: 'browser',
	target: 'es2020',
	outfile,
	logLevel: 'warning',
	define: { 'process.env.STAX_DATA': 'undefined' },
	alias: {
		'node:sqlite': join(root, 'core/shims/sqlite.ts'),
		'node:fs': join(root, 'core/shims/fs.ts'),
		'node:path': join(root, 'core/shims/path.ts'),
		'@sveltejs/kit': join(root, 'core/shims/kit.ts'),
		$lib: join(root, 'src/lib')
	}
});
console.log(`${routes.length} routes → ${relative(root, outfile)}`);
