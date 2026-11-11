<script lang="ts">
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
		<section>
			<div class="section-head">
				<a class="ghead" href="/map/{group.id}">
					<span class="avatar sm"><Icon name={group.icon} size={18} /></span>
					<h2>{group.name}</h2>
					{#if group.children.length}<span class="pill num">{money(group.pot)}</span>{/if}
				</a>
			</div>
			<div class="grid">
				{#each pots as { node, path } (node.id)}
					{@const f = figures(node)}
					<a class="card pot" href="/map/{node.id}">
						<span class="head">
							<span class="avatar soft sm"><Icon name={node.icon} size={17} /></span>
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
		padding: 22px 24px;
		border-radius: var(--radius);
		background: var(--gradient);
		color: #fff;
		box-shadow: var(--float);
	}
	/* Op een breed scherm een compact blok in plaats van over de hele breedte. */
	@media (min-width: 700px) {
		.total {
			align-self: flex-start;
			min-width: 280px;
			padding-right: 40px;
		}
	}
	.total span {
		opacity: 0.85;
		font-weight: 500;
	}
	.total strong {
		font-size: 36px;
		font-weight: 700;
		letter-spacing: -0.03em;
	}
	.check {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border-radius: var(--radius-sm);
		background: var(--accent-soft);
		font-size: 14px;
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
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 14px;
	}
	.pot {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 18px;
		transition: box-shadow 0.2s var(--ease), transform 0.2s var(--ease);
	}
	.pot:hover {
		box-shadow: var(--shadow-hover);
		transform: translateY(-2px);
	}
	.head {
		display: flex;
		align-items: center;
		gap: 10px;
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
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.03em;
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
