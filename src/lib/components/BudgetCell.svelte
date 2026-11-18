<script lang="ts">
	import { Segmentbalk } from 'vertex/web';
	import type { Snippet } from 'svelte';
	import { enhance } from '$app/forms';
	import { money, moneyInput, monthName } from '$lib/format';
	import type { NodeStats } from '$lib/types';

	// Bedrag in de kolom Gebudgetteerd dat je meteen kunt aanpassen, voor deze maand of vanaf deze maand.
	let {
		node,
		month,
		children,
		variant = 'cell'
	}: { node: NodeStats; month: string; children: Snippet; /** 'cell' in een tabelkolom, 'button' als losse knop. */ variant?: 'cell' | 'button' } = $props();

	let open = $state(false);
	let trigger = $state<HTMLButtonElement>();
	let pop = $state<HTMLDivElement>();
	let input = $state<HTMLInputElement>();
	let pos = $state({ left: 0, top: 0, above: false });
	let amount = $state('');
	let scope = $state<'alleen' | 'vanaf'>('alleen');
	let error = $state('');
	// Bij inkomsten is het bedrag wat je verwacht binnen te krijgen.
	const income = $derived(node.tree === 'inkomsten');
	const what = $derived(income ? 'Verwacht inkomen' : 'Budget');

	const WIDTH = 330;

	function place() {
		if (!trigger) return;
		const r = trigger.getBoundingClientRect();
		const up = window.innerHeight - r.bottom < 300 && r.top > 300;
		pos = {
			left: Math.max(8, Math.min(r.right - WIDTH, window.innerWidth - WIDTH - 8)),
			top: up ? r.top - 6 : r.bottom + 6,
			above: up
		};
	}

	function toggle() {
		if (open) return close();
		amount = moneyInput(node.monthly);
		// Zonder standaardbedrag ligt "alle maanden" voor de hand; anders past het alleen deze maand aan.
		scope = node.budgetTemplate ? 'alleen' : 'vanaf';
		error = '';
		place();
		open = true;
		requestAnimationFrame(() => input?.select());
	}

	function close() {
		open = false;
		trigger?.focus();
	}

	function outside(e: PointerEvent) {
		if (open && !pop?.contains(e.target as Node) && !trigger?.contains(e.target as Node)) open = false;
	}

	const done = () => {
		return async ({ result, update }: { result: { type: string; data?: Record<string, unknown> }; update: () => Promise<void> }) => {
			if (result.type === 'success') {
				open = false;
				await update();
			} else if (result.type === 'failure') {
				error = String(result.data?.error ?? 'Opslaan lukte niet.');
			} else await update();
		};
	};
</script>

<svelte:window
	onpointerdown={outside}
	onresize={() => open && place()}
	onkeydown={(e) => {
		if (open && e.key === 'Escape') {
			e.preventDefault();
			close();
		}
	}}
/>

<button
	bind:this={trigger}
	type="button"
	class="plain {variant}"
	aria-haspopup="dialog"
	aria-expanded={open}
	aria-label="{what} van {node.name} aanpassen"
	onclick={toggle}
>
	{@render children()}
	{#if node.budgetOverride && variant === 'cell'}<span class="dot" title="Wijkt deze maand af"></span>{/if}
</button>

{#if open}
	<div
		bind:this={pop}
		class="pop"
		class:above={pos.above}
		style:left="{pos.left}px"
		style:top="{pos.top}px"
		style:width="{WIDTH}px"
		role="dialog"
		aria-label="{what} van {node.name}"
	>
		<form method="POST" action="/map/{node.id}?/budget" use:enhance={done}>
			<input type="hidden" name="month" value={month} />
			<input type="hidden" name="scope" value={scope} />
			<div class="title">
				<strong>{node.name}</strong>
				<span class="muted small">
					{income ? 'Verwacht per maand' : 'Budget per maand'} ·
					{#if node.budgetTemplate}standaard {money(node.budgetTemplate)}{:else}nog geen standaard{/if}
				</span>
			</div>
			<input bind:this={input} name="amount" inputmode="decimal" placeholder="0,00" aria-label="Bedrag" bind:value={amount} />
			<Segmentbalk
				vol
				label="Geldt voor"
				bind:waarde={scope}
				opties={[
					{ waarde: 'alleen', label: `Alleen ${monthName(month, false)}` },
					{ waarde: 'vanaf', label: node.budgetTemplate ? `Vanaf ${monthName(month, false)}` : 'Alle maanden' }
				]}
			/>
			{#if error}<p class="neg small">{error}</p>{/if}
			<div class="actions">
				<button class="primary">Opslaan</button>
				{#if node.budgetOverride}
					<button class="ghost" formaction="/map/{node.id}?/herstel">Terug naar standaard</button>
				{/if}
			</div>
		</form>
	</div>
{/if}

<style>
	.cell {
		position: relative;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
		min-width: 64px;
		min-height: 32px;
		margin: -6px -10px;
		padding: 6px 10px;
		border-radius: 9px;
		color: inherit;
		font: inherit;
		transition: background-color 0.15s, box-shadow 0.15s;
	}
	.cell:hover,
	.cell[aria-expanded='true'] {
		background: var(--surface);
		box-shadow: 0 0 0 1px var(--line);
	}
	.button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 30px;
		padding: 0 12px;
		border-radius: 999px;
		color: var(--accent);
		font-weight: 600;
		font-size: 13px;
		transition: background-color 0.15s;
	}
	.button:hover,
	.button[aria-expanded='true'] {
		background: var(--accent-soft);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
	}
	.pop {
		position: fixed;
		z-index: 60;
		padding: 14px;
		border-radius: 16px;
		background: var(--surface);
		color: var(--text);
		text-align: left;
		box-shadow:
			0 0 0 0.5px var(--line),
			0 18px 50px rgb(20 10 60 / 0.22);
		animation: pop 0.16s var(--ease);
		transform-origin: top right;
	}
	.pop.above {
		transform: translateY(-100%);
		transform-origin: bottom right;
		animation-name: pop-up;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.title {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	input[name='amount'] {
		font-size: 20px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}
	.actions {
		display: flex;
		gap: 8px;
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
