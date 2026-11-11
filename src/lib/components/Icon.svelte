<script lang="ts" module>
	import { MATERIAL_GROUPS } from '$lib/material-icons';

	// Lijniconen op een raster van 24×24, 1,8 px dik.
	export const PATHS = {
		start: 'M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z',
		list: 'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
		upload: 'M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 15v4a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-4',
		tree: 'M4 5h7M8 5v14M8 12h5M8 19h5M16 12h4M16 19h4',
		settings: 'M4 7h10M18 7h2M4 17h4M12 17h8M14 5v4M8 15v4',
		left: 'M14.5 6 8.5 12l6 6',
		right: 'M9.5 6l6 6-6 6',
		check: 'M5 12.5 10 17.5 19 7',
		x: 'M6 6l12 12M18 6 6 18',
		plus: 'M12 5v14M5 12h14',
		search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
		up: 'M6 14.5 12 8.5l6 6',
		down: 'M6 9.5l6 6 6-6',
		split: 'M6 4v5a4 4 0 0 0 4 4h0a4 4 0 0 1 4 4v3M18 4v5a4 4 0 0 1-4 4',
		sidebar: 'M4.5 5h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9.5 5v14',
		grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
		trash: 'M5 7h14M10 7V5h4v2M7 7l1 12.5a1 1 0 0 0 1 .9h6a1 1 0 0 0 1-.9L17 7M10.5 11v5.5M13.5 11v5.5',
		edit: 'M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5zM14 7l3 3',
		card: 'M4.5 6h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM3.5 10h17M7 14.5h3',
		goal: 'M5.5 21V4.5M5.5 4.5h11l-2 4 2 4h-11',
		aim: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
		piggy: 'M5 11.5a6 5 0 0 1 6-5h2.5a6 5 0 0 1 5.6 3.2l1.4.3v3.5l-1.5.5a6 5 0 0 1-2 2.5V19h-2.5v-1.6a8 8 0 0 1-3 0V19H9v-2.3A5 5 0 0 1 5 12.5zM5 11.5c-1.2 0-2-.8-2-2M15.5 10h.01M10.5 6.5V5',
		folder: 'M3.5 7a1.5 1.5 0 0 1 1.5-1.5h4.2l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5v8.3a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z',
		info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.8h.01',
		coins: 'M9 11c3.3 0 6-1.1 6-2.5S12.3 6 9 6 3 7.1 3 8.5 5.7 11 9 11zM3 8.5v4C3 13.9 5.7 15 9 15s6-1.1 6-2.5v-4M9 15v3.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-7c0-1.4-2.7-2.5-6-2.5M15 13c3.3 0 6-1.1 6-2.5M9 18.5'
	} as const;

	export type IconName = keyof typeof PATHS;

	/** Iconen voor budgetten: Google Material Symbols, rounded en gevuld. */
	export const MATERIAL = new Map(MATERIAL_GROUPS.flatMap(([, icons]) => icons.map(([name, , d]) => [name, d] as const)));
</script>

<script lang="ts">
	let { name, size = 20 }: { name: string | null | undefined; size?: number } = $props();
	const filled = $derived(name ? MATERIAL.get(name) : undefined);
	const d = $derived(PATHS[(name ?? 'folder') as IconName] ?? PATHS.folder);
</script>

{#if filled}
	<svg width={size} height={size} viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true"><path d={filled} /></svg>
{:else}
	<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
		<path {d} />
	</svg>
{/if}
