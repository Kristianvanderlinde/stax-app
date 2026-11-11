// Zet de Material-iconen van de website (src/lib/material-icons.ts) als vector-afbeeldingen in de iOS-app.
//   node scripts/ios-iconen.mjs
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const source = readFileSync('src/lib/material-icons.ts', 'utf8');
const icons = [...source.matchAll(/\["([a-z0-9_]+)", "[^"]*", "([^"]+)"\]/g)].map((m) => [m[1], m[2]]);
const dir = 'ios/Stax/Assets.xcassets/Icons';
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'Contents.json'), JSON.stringify({ info: { author: 'xcode', version: 1 } }, null, 2));
for (const [name, d] of icons) {
	const set = join(dir, `icon-${name}.imageset`);
	mkdirSync(set);
	// Material gebruikt viewBox "0 -960 960 960"; omgezet naar een gewone viewBox voor Xcode.
	writeFileSync(join(set, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="960" viewBox="0 0 960 960"><path transform="translate(0 960)" d="${d}"/></svg>`);
	writeFileSync(
		join(set, 'Contents.json'),
		JSON.stringify(
			{
				images: [{ filename: `${name}.svg`, idiom: 'universal' }],
				info: { author: 'xcode', version: 1 },
				properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' }
			},
			null,
			2
		)
	);
}
// De navigatie- en instellingeniconen (lijntekeningen) uit Icon.svelte, voor de tabbalk.
const iconSource = readFileSync('src/lib/components/Icon.svelte', 'utf8');
for (const name of ['start', 'piggy', 'list', 'settings', 'upload', 'card', 'goal', 'folder']) {
	const d = iconSource.match(new RegExp(`\\b${name}: '([^']+)'`))?.[1];
	if (!d) throw new Error(`Navigatie-icoon ${name} niet gevonden in Icon.svelte`);
	const set = join(dir, `nav-${name}.imageset`);
	mkdirSync(set);
	writeFileSync(join(set, `${name}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`);
	writeFileSync(
		join(set, 'Contents.json'),
		JSON.stringify({ images: [{ filename: `${name}.svg`, idiom: 'universal' }], info: { author: 'xcode', version: 1 }, properties: { 'preserves-vector-representation': true, 'template-rendering-intent': 'template' } }, null, 2)
	);
}
console.log(`${icons.length} iconen`);

// Ook de lijst met namen, groepen en zoekwoorden, voor de iconenkiezer in de app.
const body = source.slice(source.indexOf('export const MATERIAL_GROUPS'));
const groups = new Function(`return ${body.slice(body.indexOf('= [') + 2).replace(/;\s*$/, '')}`)();
const q = (s) => JSON.stringify(s);
const lines = groups.map(([group, list]) => `\t(${q(group)}, [\n${list.map(([name, words]) => `\t\t(${q(name)}, ${q(words)})`).join(',\n')}\n\t])`);
writeFileSync(
	'ios/Stax/Components/IconCatalog.swift',
	`// Gegenereerd door scripts/ios-iconen.mjs uit src/lib/material-icons.ts. Niet met de hand aanpassen.\n\n/// Alle iconen voor budgetten, per groep, met zoekwoorden.\nenum IconCatalog {\n\tstatic let groups: [(name: String, icons: [(name: String, words: String)])] = [\n${lines.join(',\n')}\n\t]\n}\n`
);
