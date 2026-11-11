<script lang="ts">
	import type { CatOption } from '$lib/types';
	import { kindTag } from '$lib/types';
	import Icon from './Icon.svelte';

	// Doorzoekbare mappenlijst met de boomstructuur zichtbaar. Pijltjes + Enter werken vanuit het zoekveld.
	let {
		options,
		selected = null,
		onpick,
		filter = () => true,
		autofocus = false,
		allowEmpty = false,
		rootLabel = null,
		maxHeight = 'min(46vh, 420px)'
	}: {
		options: CatOption[];
		selected?: number | null;
		onpick: (id: number | null) => void;
		filter?: (o: CatOption) => boolean;
		autofocus?: boolean;
		allowEmpty?: boolean;
		rootLabel?: string | null;
		maxHeight?: string;
	} = $props();

	let query = $state('');
	let active = $state(0);
	let input = $state<HTMLInputElement>();
	let list = $state<HTMLUListElement>();

	const q = $derived(query.trim().toLowerCase());
	// Een plek kiezen (rootLabel) kan ook een groep zijn; een boeking of regel hoort altijd bij een budget zonder budgetten eronder.
	const placing = $derived(rootLabel != null);
	const pickable = (o: CatOption | null) => o === null || placing || (o.depth > 0 && !o.isGroup);
	const visible = $derived.by(() => {
		// Groepen blijven zichtbaar als kopje boven de budgetten die je kunt kiezen, zodat je de structuur ziet.
		// Ook als het filter de groep zelf niet toelaat (bijv. alleen spaarpotten). Bij zoeken alleen de budgetten.
		let base: CatOption[];
		if (placing) base = options.filter(filter);
		else {
			const leaves = options.filter((o) => o.depth > 0 && !o.isGroup && filter(o));
			const byId = new Map(options.map((o) => [o.id, o]));
			const keep = new Set(leaves.map((o) => o.id));
			if (!q)
				for (const o of leaves)
					for (let p = byId.get(o.parent ?? -1); p && p.depth > 0; p = byId.get(p.parent ?? -1)) keep.add(p.id);
			base = options.filter((o) => keep.has(o.id));
		}
		if (!q) return base;
		// Eerst mappen waarvan de naam zelf matcht, dan die waarvan alleen het pad matcht.
		const own = base.filter((o) => o.name.toLowerCase().includes(q));
		const path = base.filter((o) => !own.includes(o) && o.label.toLowerCase().includes(q));
		return [...own, ...path];
	});
	const items = $derived<(CatOption | null)[]>(allowEmpty && !q ? [null, ...visible] : visible);

	$effect(() => {
		// Bij een nieuwe zoekterm begint de selectie bovenaan; anders bij de huidige keuze.
		void q;
		const i = items.findIndex((o) => (o?.id ?? null) === selected);
		active = i >= 0 ? i : Math.max(0, items.findIndex(pickable));
	});

	$effect(() => {
		if (autofocus) input?.focus();
	});

	$effect(() => {
		void active;
		list?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	});

	function key(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			// Groepskopjes overslaan.
			const step = e.key === 'ArrowDown' ? 1 : -1;
			for (let i = active + step; i >= 0 && i < items.length; i += step)
				if (pickable(items[i])) {
					active = i;
					break;
				}
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const o = items[active];
			if (o !== undefined && pickable(o)) onpick(o?.id ?? null);
		}
	}

	function parts(name: string) {
		// Markeer de zoekterm in de naam.
		const i = name.toLowerCase().indexOf(q);
		if (!q || i < 0) return [name, '', ''];
		return [name.slice(0, i), name.slice(i, i + q.length), name.slice(i + q.length)];
	}

	function header(o: CatOption, i: number) {
		const prev = items[i - 1];
		return !q && (i === 0 || !prev || prev.tree !== o.tree) ? (o.tree === 'uitgaven' ? 'Uitgaven' : 'Inkomsten') : null;
	}
</script>

<div class="picker">
	<label class="search">
		<Icon name="search" size={17} />
		<span class="sr-only">Zoek een budget</span>
		<input bind:this={input} type="search" placeholder="Zoek een budget…" bind:value={query} onkeydown={key} autocomplete="off" />
	</label>
	<ul bind:this={list} role="listbox" aria-label="Budgetten" style:max-height={maxHeight}>
		{#each items as o, i (o?.id ?? 'leeg')}
			{#if o === null}
				<li>
					<button
						type="button"
						class="plain opt empty-opt"
						role="option"
						aria-selected={selected === null}
						data-active={active === i}
						onclick={() => onpick(null)}
						onmousemove={() => (active = i)}
					>
						<span class="ico"><Icon name="x" size={15} /></span>
						<span class="name muted">Niet ingedeeld</span>
					</button>
				</li>
			{:else}
				{@const h = header(o, i)}
				{@const [a, m, b] = parts(o.name)}
				{#if h}<li class="tree-head" aria-hidden="true">{h}</li>{/if}
				{#if !pickable(o)}
					<li class="grp" style:--indent={Math.max(0, o.depth - 1)}>
						<span class="ico" class:solid={o.depth === 1}><Icon name={o.icon} size={15} /></span>
						<span>{o.name}</span>
					</li>
				{:else}
				<li>
					<button
						type="button"
						class="plain opt"
						class:top={o.depth === 1 && !q}
						class:root={o.depth === 0}
						class:nested={!q && o.depth > 1}
						role="option"
						aria-selected={selected === o.id}
						data-active={active === i}
						style:--indent={q ? 0 : Math.max(0, o.depth - 1)}
						onclick={() => onpick(o.id)}
						onmousemove={() => (active = i)}
					>
						<span class="ico" class:solid={o.depth === 1}><Icon name={o.icon} size={15} /></span>
						<span class="name">
							{#if q && o.depth > 1}<span class="path">{o.label.slice(0, o.label.lastIndexOf(' › ') + 3)}</span>{/if}{#if o.depth === 0}{rootLabel ?? (o.tree === 'uitgaven' ? 'Algemeen' : 'Overige inkomsten')}{:else}{a}<mark>{m}</mark>{b}{/if}
						</span>
						{#if o.tree === 'uitgaven' && o.depth > 0 && kindTag(o.kind)}<span class="kind pot">{kindTag(o.kind)}</span>{/if}
						{#if selected === o.id}<span class="tick"><Icon name="check" size={16} /></span>{/if}
					</button>
				</li>
				{/if}
			{/if}
		{:else}
			<li class="none small">Geen budget gevonden voor “{query}”</li>
		{/each}
	</ul>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-height: 0;
	}
	.search {
		position: relative;
		display: block;
		color: var(--muted);
	}
	.search :global(svg) {
		position: absolute;
		left: 12px;
		top: 13px;
	}
	.search input {
		padding-left: 36px;
		background: var(--surface-2);
		border-color: transparent;
	}
	.search input:focus {
		background: var(--surface);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 2px;
		overflow: auto;
		overscroll-behavior: contain;
	}
	.tree-head {
		padding: 10px 10px 4px;
		font-size: 11.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.opt {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 38px;
		padding: 5px 10px 5px calc(10px + var(--indent, 0) * 22px);
		border-radius: 9px;
		font-size: 14.5px;
		position: relative;
	}
	/* Een dun lijntje laat zien onder welke map een submap valt. */
	.opt.nested::before {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		left: calc(10px + (var(--indent) - 1) * 22px + 11px);
		border-left: 1px solid var(--line);
	}
	.opt[data-active='true'] {
		background-color: var(--surface-2);
	}
	.opt[aria-selected='true'] {
		color: var(--accent);
	}
	.opt.top {
		font-weight: 600;
		margin-top: 4px;
	}
	.ico {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		flex-shrink: 0;
	}
	.ico.solid {
		background: var(--gradient);
		color: #fff;
	}
	.root .ico,
	.empty-opt .ico {
		background: var(--fill);
		color: var(--muted);
	}
	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.path {
		color: var(--muted);
		font-weight: 400;
	}
	mark {
		background: color-mix(in srgb, var(--accent) 22%, transparent);
		color: inherit;
		border-radius: 3px;
	}
	/* Een groep is geen keuze, alleen een kopje boven zijn budgetten. */
	.grp {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 34px;
		margin-top: 4px;
		padding: 5px 10px 5px calc(10px + var(--indent, 0) * 22px);
		font-size: 13.5px;
		font-weight: 600;
		color: var(--muted);
	}
	.kind {
		font-size: 11.5px;
		font-weight: 500;
		color: var(--faint);
		flex-shrink: 0;
	}
	.kind.pot {
		color: var(--accent);
		opacity: 0.8;
	}
	.tick {
		display: grid;
		color: var(--accent);
	}
	.none {
		padding: 18px 10px;
		text-align: center;
		color: var(--muted);
	}
</style>
