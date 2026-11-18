// Elke groep heeft een eigen kleur; de budgetten in die groep krijgen dezelfde tint.
// De groep kiest zelf (categories.color); zonder keuze volgt de kleur de plek in de lijst met groepen.
export const HUES = ['accent', 'lucht', 'koraal', 'mint', 'zon'] as const;
export type Hue = (typeof HUES)[number];
export const HUE_NAMES: Record<Hue, string> = { accent: 'Paars', lucht: 'Blauw', koraal: 'Rood', mint: 'Groen', zon: 'Geel' };

export const isHue = (v: unknown): v is Hue => HUES.includes(v as Hue);

/** Kleur van een groep, uit de map die de layout levert (id → kleur). */
export const hueOf = (groupId: number | null | undefined, hues: Record<number, string>): Hue => {
	const h = hues[groupId ?? -1];
	return isHue(h) ? h : 'accent';
};

/** Inline stijl met --tint (zacht vlak), --tint-fg (icoon en tekst) en --solid (effen vlak voor de groep zelf). */
export function hueStyle(groupId: number | null | undefined, hues: Record<number, string>, hue: Hue = hueOf(groupId, hues)): string {
	return hue === 'accent'
		? '--tint: var(--accent-zacht); --tint-fg: var(--accent-standaard); --solid: var(--verloop-accent); --solid-fg: var(--tekst-op-accent)'
		: `--tint: var(--categorie-${hue}-zacht); --tint-fg: var(--categorie-${hue}-tekst); --solid: var(--categorie-${hue}); --solid-fg: var(--categorie-${hue}-zacht)`;
}
