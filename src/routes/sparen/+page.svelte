<script lang="ts">
	import { hueStyle } from '$lib/hue';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';
	import { figures } from '$lib/figures';
	import { money, monthName, shortDate } from '$lib/format';
	import { kindTag } from '$lib/types';

	let { data } = $props();

	const potDiff = $derived(data.savingsTotal - data.totalSpaar);
	const signed = (v: number) => money(v, true);
</script>

<svelte:head><title>Sparen · Stax</title></svelte:head>

<div class="stack">
	<header class="top">
		<h1>Sparen</h1>
		<span class="muted">Stand op {shortDate(data.balanceDate)}</span>
	</header>

	<section class="summary">
		<div class="total">
			<span>Totaal gespaard</span>
			<strong class="num">{money(data.total)}</strong>
		</div>
		<!-- Alleen een melding als de potten niet kloppen met de spaarrekening. -->
		{#if data.hasSavings && Math.abs(potDiff) >= 1}
			<div class="check off">
				{#if potDiff > 0}
					<span>
						Op de spaarrekening staat <strong class="num">{money(potDiff)}</strong> meer dan bij de budgetten. Dat geld is nog niet aan een budget toegewezen.
						<a class="link" href="/boekingen?status=open&rekening={data.savingsId}">Deel de boekingen op de spaarrekening in</a> of
						<a class="link" href="/instellingen/start">verdeel het startsaldo</a>.
					</span>
				{:else}
					<span>
						De budgetten bevatten <strong class="num">{money(-potDiff)}</strong> meer dan er op de spaarrekening staat. Er zijn boekingen op de
						spaarrekening, zoals opnames, die nog niet aan een budget gekoppeld zijn.
						<a class="link" href="/boekingen?status=open&rekening={data.savingsId}">Koppel ze aan een budget</a>.
					</span>
				{/if}
			</div>
		{/if}
	</section>

	{#each data.groups as { group, pots } (group.id)}
		<section style={hueStyle(group.id, page.data.groupHues ?? {})}>
			<div class="section-head">
				<a class="ghead" href="/map/{group.id}">
					<span class="tegel groep"><Icon name={group.icon} size={18} /></span>
					<h2>{group.name}</h2>
					{#if group.children.length}<span class="pill num">{money(group.pot)}</span>{/if}
				</a>
			</div>
			<div class="grid">
				{#each pots as { node, path } (node.id)}
					{@const f = figures(node)}
					<a class="card pot" href="/map/{node.id}">
						<span class="head">
							<span class="tegel"><Icon name={node.icon} size={17} /></span>
							<span class="names">
								<strong>{node.name}</strong>
								<span class="muted small">{path || kindTag(f.kind)}{node.funding === 'betaal' ? ' · op de betaalrekening' : ''}</span>
							</span>
						</span>
						<strong class="num bal" class:neg={(f.balance ?? 0) < 0}>{money(f.balance ?? 0)}</strong>
						{#if f.bar}
							<span class="bar" class:quiet={f.kind === 'spaarpot'}><span style:width="{Math.min(100, Math.max(0, f.bar.pct))}%"></span></span>
							<span class="small muted" class:warn={f.bar.warn}>{f.bar.text}</span>
						{/if}
						{#if !f.bar}
							<span class="figs small num">
								<span class="muted">gepland {money(f.plan ?? 0)}</span>
								<span class:pos={f.net > 0}>{monthName(data.month, false)} {signed(f.net)}</span>
							</span>
						{/if}
					</a>
				{/each}
			</div>
		</section>
	{/each}
</div>

<style>
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.summary {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.total {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--ruimte-6);
		border-radius: var(--vorm-xxl);
		background: var(--verloop-accent);
		color: var(--tekst-op-accent);
		box-shadow: var(--schaduw-accent);
	}
	.total span {
		opacity: 0.9;
		font: 600 15px/22px var(--tekst-familie);
	}
	.total strong {
		font: 700 34px/40px var(--tekst-familie);
	}
	.check {
		display: flex;
		align-items: center;
		gap: var(--ruimte-3);
		padding: var(--ruimte-4) var(--ruimte-5);
		border-radius: 20px;
		background: var(--accent-soft);
	}
	.check.off {
		background: var(--warn-soft);
	}
	.ghead {
		display: flex;
		align-items: center;
		gap: 10px;
		color: inherit;
		text-decoration: none;
	}
	/* Groepstotaal als label direct achter de naam. */
	.pill {
		padding: 3px 10px;
		border-radius: 99px;
		background: var(--accent-soft);
		color: var(--accent);
		font-size: 14px;
		font-weight: 650;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: var(--ruimte-4);
	}
	.pot {
		display: flex;
		flex-direction: column;
		gap: var(--ruimte-3);
		padding: var(--ruimte-5);
		transition: box-shadow 0.2s var(--ease), transform 0.2s var(--ease);
	}
	.pot:hover {
		box-shadow: var(--shadow-hover);
		transform: translateY(-2px);
	}
	.head {
		display: flex;
		align-items: center;
		gap: var(--ruimte-3);
		min-width: 0;
	}
	.names {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.names > * {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bal {
		font: 700 28px/34px var(--tekst-familie);
	}
	.bar.quiet > span {
		background: color-mix(in srgb, var(--accent) 45%, transparent);
	}
	.warn {
		color: var(--warn);
	}
	.figs {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		padding-top: 8px;
		border-top: 0.5px solid var(--line);
	}
</style>
