<script lang="ts">
	import { goto } from '$app/navigation';
	import CategoryCombo from './CategoryCombo.svelte';
	import Icon from './Icon.svelte';
	import { monthName } from '$lib/format';
	import { shiftMonth } from '$lib/months';
	import type { CatOption } from '$lib/types';

	// Zwevende balk onderaan: wisselen van maand, en op een detailpagina ook bladeren door de budgetten.
	// Staat onderaan de inhoud met position: sticky, zodat hij altijd binnen de kolom blijft.
	type Link = { id: number; name: string } | null;
	let {
		month,
		budget = null,
		onlyAfterScroll = false
	}: {
		month: string;
		budget?: { id: number; prev: Link; next: Link; groups: boolean; options: CatOption[] } | null;
		/** Pas tonen als je naar beneden scrolt (bijv. als de maand bovenaan al te zien is). */
		onlyAfterScroll?: boolean;
	} = $props();

	let scrolled = $state(false);
	const visible = $derived(!onlyAfterScroll || scrolled);
	const monthHref = (m: string) => `?maand=${m}`;
	const budgetHref = (id: number) => `/map/${id}?maand=${month}`;
	const short = (m: string) => `${monthName(m, false).slice(0, 3)} ’${m.slice(2, 4)}`;

	// Pijltjestoetsen bladeren door de budgetten, behalve tijdens het typen.
	function key(e: KeyboardEvent) {
		if (!budget || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
		const t = e.target as HTMLElement | null;
		if (t?.closest('input, textarea, select, [contenteditable], dialog[open], [role="dialog"]')) return;
		const to = e.key === 'ArrowLeft' ? budget.prev : e.key === 'ArrowRight' ? budget.next : null;
		if (!to) return;
		e.preventDefault();
		goto(budgetHref(to.id), { noScroll: true });
	}
</script>

<svelte:window onscroll={() => (scrolled = window.scrollY > 140)} onkeydown={key} />

<div class="periodbar" class:hidden={!visible} aria-hidden={!visible}>
	<div class="part" role="group" aria-label="Maand">
		<a class="btn icon" href={monthHref(shiftMonth(month, -1))} data-sveltekit-noscroll aria-label="Vorige maand" tabindex={visible ? 0 : -1}><Icon name="left" size={18} /></a>
		<span class="label"><span class="long">{monthName(month)}</span><span class="short">{short(month)}</span></span>
		<a class="btn icon" href={monthHref(shiftMonth(month, 1))} data-sveltekit-noscroll aria-label="Volgende maand" tabindex={visible ? 0 : -1}><Icon name="right" size={18} /></a>
	</div>
	{#if budget}
		<span class="sep" aria-hidden="true"></span>
		<div class="part budget" role="group" aria-label={budget.groups ? 'Groep' : 'Budget'}>
			{#if budget.prev}
				<a class="btn icon" href={budgetHref(budget.prev.id)} data-sveltekit-noscroll aria-label="Vorige: {budget.prev.name}" title={budget.prev.name}><Icon name="left" size={18} /></a>
			{:else}<span class="btn icon off" aria-hidden="true"><Icon name="left" size={18} /></span>{/if}
			<span class="pick">
				<CategoryCombo
					label={budget.groups ? 'Andere groep' : 'Ander budget'}
					variant="inline"
					options={budget.options}
					filter={(o) => o.depth > 0 && o.isGroup === budget.groups}
					value={budget.id}
					onchange={(id) => id && goto(budgetHref(id), { noScroll: true })}
				/>
			</span>
			{#if budget.next}
				<a class="btn icon" href={budgetHref(budget.next.id)} data-sveltekit-noscroll aria-label="Volgende: {budget.next.name}" title={budget.next.name}><Icon name="right" size={18} /></a>
			{:else}<span class="btn icon off" aria-hidden="true"><Icon name="right" size={18} /></span>{/if}
		</div>
	{/if}
</div>

<style>
	.periodbar {
		flex: none;
		position: sticky;
		z-index: 15;
		bottom: 18px;
		align-self: center;
		display: flex;
		align-items: center;
		gap: 6px;
		max-width: 100%;
		margin-top: 8px;
		padding: 6px;
		border-radius: 999px;
		background: color-mix(in srgb, var(--surface) 88%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--line);
		box-shadow: var(--float);
		transition:
			opacity 0.2s,
			transform 0.2s var(--ease);
	}
	.periodbar.hidden {
		opacity: 0;
		transform: translateY(12px);
		pointer-events: none;
	}
	.part {
		display: flex;
		align-items: center;
		gap: 2px;
		min-width: 0;
	}
	.label {
		min-width: 120px;
		padding: 0 6px;
		text-align: center;
		font-weight: 600;
		text-transform: capitalize;
		white-space: nowrap;
	}
	.short {
		display: none;
	}
	.sep {
		width: 1px;
		height: 24px;
		background: var(--line);
	}
	.pick {
		min-width: 0;
		max-width: 240px;
	}
	.pick :global(.path) {
		display: none;
	}
	.off {
		opacity: 0.3;
	}
	/* Telefoon: boven de menubalk, en compacter. */
	@media (max-width: 859px) {
		.periodbar {
			bottom: calc(88px + env(safe-area-inset-bottom));
		}
	}
	@media (max-width: 520px) {
		.label {
			min-width: 0;
		}
		.long {
			display: none;
		}
		.short {
			display: inline;
		}
		.pick {
			max-width: 150px;
		}
	}
</style>
