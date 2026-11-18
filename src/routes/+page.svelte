<script lang="ts">
	import MonthList from '$lib/components/MonthList.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import PeriodBar from '$lib/components/PeriodBar.svelte';
	import { money, monthName, shortDate } from '$lib/format';

	let { data } = $props();

	function shift(month: string, delta: number) {
		const [y, m] = month.split('-').map(Number);
		return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
	}
</script>

<svelte:head><title>Budgetoverzicht · Stax</title></svelte:head>

{#if !data.hasData}
	<div class="stack">
		<h1>Welkom bij Stax</h1>
		<div class="card welcome">
			<p>Begin met het uploaden van de XML-exports van jullie betaal- en spaarrekening.</p>
			<a class="btn primary" href="/upload"><Icon name="upload" size={18} /> Bankafschrift uploaden</a>
		</div>
	</div>
{:else}
	<div class="stack">
		<header class="top">
			<div class="month">
				<a class="btn icon" href="?maand={shift(data.month, -1)}" aria-label="Vorige maand"><Icon name="left" /></a>
				<h1>{monthName(data.month)}</h1>
				<a class="btn icon" href="?maand={shift(data.month, 1)}" aria-label="Volgende maand"><Icon name="right" /></a>
			</div>
			<a class="btn primary" href="/upload"><Icon name="upload" size={18} /> Upload</a>
		</header>

		<section class="tiles">
			<div class="card tile accent">
				<span class="head"><span class="label"><Icon name="in" size={18} /> Inkomsten</span>
					<InfoTip label="inkomsten">
						Wat er deze maand binnenkwam.
						{#if data.income.expected}Verwacht: {money(data.income.expected)}{data.income.note ? `, ${data.income.note}` : ''}.{:else}Vul onderaan bij Inkomsten in wat je verwacht, dan kun je vooruit plannen.{/if}
					</InfoTip>
				</span>
				<strong class="num">{money(data.income.received)}</strong>
			</div>
			<div class="card tile accent">
				<span class="head"><span class="label"><Icon name="out" size={18} /> Uitgaven</span>
					<InfoTip label="uitgaven">Wat er deze maand is uitgegeven, met terugbetalingen er al af.</InfoTip>
				</span>
				<strong class="num">{money(data.totals.uitgaven)}</strong>
			</div>
			<div class="card tile">
				<span class="head"><span class="label">Gebudgetteerd</span>
					<InfoTip label="gebudgetteerd">Alle budgetten van deze maand samen, inclusief wat je in budgetten die sparen inlegt.</InfoTip>
				</span>
				<strong class="num">{money(data.totals.planned)}</strong>
			</div>
			<div class="card tile">
				<span class="head"><span class="label">Over</span>
					<InfoTip label="over">
						{data.income.expected ? 'Verwacht inkomen' : 'Inkomsten'} min gebudgetteerd. Zo zie je aan het begin van de maand al of je plan past.
						{#if data.income.note}Er is {data.income.note}.{/if}
					</InfoTip>
				</span>
				<strong class="num" class:neg={data.income.base - data.totals.planned < 0}>{money(data.income.base - data.totals.planned)}</strong>
			</div>
		</section>

		<!-- Wat er nog moet gebeuren: compacte regels onder de tegels. -->
		{#if data.open.n > 0 || data.refunds.n > 0 || (data.hasSavings && !data.startdatum)}
			<div class="todos card">
				{#if data.open.n > 0}
					<a class="todo" href="/boekingen?status=open&maand={data.month}">
						<span class="t-icon"><Icon name="list" size={18} /></span>
						<span class="t-text"><strong class="num">{data.open.n}</strong> {data.open.n === 1 ? 'boeking' : 'boekingen'} uit {monthName(data.month, false)} nog niet ingedeeld</span>
						<span class="t-go">Indelen <Icon name="right" size={16} /></span>
					</a>
				{/if}
				{#if data.refunds.n > 0}
					<a class="todo" href="/boekingen?status=terug">
						<span class="t-icon"><Icon name="coins" size={18} /></span>
						<span class="t-text"><strong class="num">{money(data.refunds.cents)}</strong> nog terug te krijgen voor {data.refunds.n} {data.refunds.n === 1 ? 'uitgave' : 'uitgaven'}</span>
						<span class="t-go">Bekijken <Icon name="right" size={16} /></span>
					</a>
				{/if}
				{#if data.hasSavings && !data.startdatum}
					<a class="todo" href="/instellingen/start">
						<span class="t-icon"><Icon name="goal" size={18} /></span>
						<span class="t-text"><strong>Startsaldo</strong> Geef aan hoeveel er op de spaarrekening al bij welk budget hoort.</span>
						<span class="t-go">Verdelen <Icon name="right" size={16} /></span>
					</a>
				{/if}
			</div>
		{/if}

		<section>
			<div class="section-head">
				<h2>Budgetten in {monthName(data.month, false)}</h2>
			</div>
			<MonthList groups={data.rows} month={data.month} losse />
		</section>

		{#if data.incomeRows.length}
			<section>
				<div class="section-head"><h2>Inkomsten</h2></div>
				<MonthList groups={[{ group: data.incomeRoot, rows: data.incomeRows }]} month={data.month} header={false} income />
			</section>
		{/if}
		<PeriodBar month={data.month} onlyAfterScroll />
	</div>
{/if}

<style>
	.welcome {
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		align-items: flex-start;
	}
	.welcome p {
		margin: 0;
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.month {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.month h1 {
		text-transform: capitalize;
		min-width: 0;
	}
	@media (max-width: 520px) {
		.month h1 {
			font-size: 28px;
		}
		.top > .btn {
			display: none;
		}
	}

	/* Wat nog moet gebeuren: één kaart met een regel per taak. */
	.todos {
		display: flex;
		flex-direction: column;
		padding: var(--ruimte-2);
	}
	.todo {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--ruimte-3);
		padding: var(--ruimte-3) var(--ruimte-3);
		border-radius: var(--vorm-lg);
		color: var(--text);
		transition: background-color 0.15s;
	}
	.todo + .todo::before {
		content: '';
		position: absolute;
		top: 0;
		left: var(--ruimte-3);
		right: var(--ruimte-3);
		border-top: 1px solid var(--line);
	}
	.todo:hover::before,
	.todo:hover + .todo::before {
		opacity: 0;
	}
	.todo:hover {
		background: var(--surface-2);
	}
	.t-icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: var(--vorm-md);
		background: var(--accent-zacht);
		color: var(--accent-standaard);
	}
	.t-text {
		flex: 1;
		min-width: 0;
	}
	.t-text strong {
		font-weight: 600;
	}
	.t-go {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font: 600 15px/22px var(--tekst-familie);
		color: var(--accent-standaard);
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--ruimte-4);
	}
	@media (min-width: 900px) {
		.tiles {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: var(--ruimte-5);
	}
	.tile.accent {
		background: var(--verloop-accent);
		border-color: transparent;
		box-shadow: var(--schaduw-accent);
		color: var(--tekst-op-accent);
	}
	.tile.accent :global(.info button) {
		color: rgb(255 255 255 / 0.8);
	}
	.label {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: var(--muted);
		font: 600 15px/22px var(--tekst-familie);
	}
	.tile.accent .label {
		color: var(--tekst-op-accent);
	}
	.tile strong {
		font: 700 28px/34px var(--tekst-familie);
	}

	.tile .head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
</style>
