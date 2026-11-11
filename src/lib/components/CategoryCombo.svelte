<script lang="ts">
	import type { CatOption } from '$lib/types';
	import CategoryPicker from './CategoryPicker.svelte';
	import Icon from './Icon.svelte';

	// Knop die een zwevend, doorzoekbaar mappenmenu opent. Vervangt de gewone keuzelijst.
	let {
		options,
		value = null,
		onchange,
		filter = () => true,
		placeholder = 'Kies een budget…',
		variant = 'field',
		attention = false,
		disabled = false,
		allowEmpty = false,
		rootLabel = null,
		label
	}: {
		options: CatOption[];
		value?: number | null;
		onchange: (id: number | null) => void;
		filter?: (o: CatOption) => boolean;
		placeholder?: string;
		/** 'field' ziet eruit als invoerveld, 'inline' als compacte knop in een tabelrij. */
		variant?: 'field' | 'inline';
		attention?: boolean;
		disabled?: boolean;
		allowEmpty?: boolean;
		/** Naam voor de wortel van een boom, bijvoorbeeld "Hoofdniveau" bij het kiezen van een plek. */
		rootLabel?: string | null;
		label: string;
	} = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement>();
	let pop = $state<HTMLDivElement>();
	let pos = $state({ left: 0, top: 0, width: 340, maxH: 420, above: false });

	const current = $derived(options.find((o) => o.id === value) ?? null);

	function place() {
		if (!trigger) return;
		const r = trigger.getBoundingClientRect();
		const width = Math.min(window.innerWidth - 16, Math.max(r.width, 360));
		const below = window.innerHeight - r.bottom - 12;
		const above = r.top - 12;
		const up = below < 320 && above > below;
		pos = {
			left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
			top: up ? r.top - 6 : r.bottom + 6,
			width,
			maxH: Math.min(440, (up ? above : below) - 70),
			above: up
		};
	}

	function toggle() {
		if (open) return close();
		place();
		open = true;
	}

	function close() {
		open = false;
		trigger?.focus();
	}

	function pick(id: number | null) {
		open = false;
		trigger?.focus();
		if (id !== value) onchange(id);
	}

	function outside(e: PointerEvent) {
		if (open && !pop?.contains(e.target as Node) && !trigger?.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window
	onpointerdown={outside}
	onresize={() => open && place()}
	onkeydown={(e) => {
		if (open && e.key === 'Escape') {
			// Niet ook het indeelvenster eromheen sluiten.
			e.preventDefault();
			e.stopPropagation();
			close();
		}
	}}
/>

<button
	bind:this={trigger}
	type="button"
	class="plain trigger {variant}"
	class:attention
	class:empty={!current}
	aria-haspopup="listbox"
	aria-expanded={open}
	aria-label="{label}: {current?.label ?? placeholder}"
	{disabled}
	onclick={toggle}
>
	{#if current}<span class="ico"><Icon name={current.icon} size={14} /></span>{/if}
	<span class="text">
		{#if current}
			{#if current.depth > 1 && variant === 'inline'}<span class="path">{current.label.slice(0, current.label.lastIndexOf(' › ') + 3)}</span>{/if}{current.depth ===
				0 && rootLabel
				? rootLabel
				: variant === 'inline'
					? current.name
					: current.label}
		{:else}{placeholder}{/if}
	</span>
	<Icon name="down" size={14} />
</button>

{#if open}
	<div
		bind:this={pop}
		class="pop"
		class:above={pos.above}
		style:left="{pos.left}px"
		style:top="{pos.top}px"
		style:width="{pos.width}px"
		role="dialog"
		aria-label={label}
	>
		<CategoryPicker {options} {filter} selected={value} onpick={pick} autofocus {allowEmpty} {rootLabel} maxHeight="{pos.maxH}px" />
	</div>
{/if}

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: 100%;
		min-width: 0;
		transition: background-color 0.15s, border-color 0.15s;
	}
	.trigger:disabled {
		opacity: 0.5;
		cursor: default;
	}
	.trigger > :global(svg) {
		flex-shrink: 0;
		opacity: 0.55;
	}
	.text {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		text-align: left;
	}
	.path {
		opacity: 0.6;
		font-weight: 450;
	}
	.ico {
		display: grid;
		place-items: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: var(--accent-soft);
		color: var(--accent);
		flex-shrink: 0;
	}

	.field {
		width: 100%;
		min-height: 44px;
		padding: 8px 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		background: var(--surface);
		font-size: 15px;
	}
	.field.empty .text {
		color: var(--muted);
	}
	.field[aria-expanded='true'] {
		border-color: var(--accent);
		box-shadow: 0 0 0 4px var(--accent-soft);
	}

	.inline {
		max-width: 280px;
		padding: 5px 10px 5px 6px;
		border-radius: 999px;
		color: var(--accent);
		font-weight: 550;
		font-size: 13.5px;
	}
	.inline:hover:not(:disabled),
	.inline[aria-expanded='true'] {
		background: var(--accent-soft);
	}
	.inline.empty {
		padding-left: 12px;
	}
	.inline.attention {
		background: var(--warn-soft);
		color: var(--warn);
	}

	.pop {
		position: fixed;
		z-index: 60;
		padding: 10px;
		border-radius: 16px;
		background: var(--surface);
		box-shadow:
			0 0 0 0.5px var(--line),
			0 18px 50px rgb(20 10 60 / 0.22);
		animation: pop 0.16s var(--ease);
		transform-origin: top left;
	}
	.pop.above {
		transform: translateY(-100%);
		transform-origin: bottom left;
		animation-name: pop-up;
	}
	@keyframes pop {
		from {
			opacity: 0;
			transform: scale(0.97) translateY(-4px);
		}
	}
	@keyframes pop-up {
		from {
			opacity: 0;
			transform: translateY(-100%) scale(0.97);
		}
	}
</style>
