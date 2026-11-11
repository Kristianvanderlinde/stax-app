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

		<!-- Rekeningen als staande kaarten naast elkaar. -->
		<div class="hero">
			{#each data.accounts as a, i}
				<div class="balance" class:alt={i % 2 === 1}>
					<span class="b-name">{a.name}</span>
					<span class="b-foot">
						<strong class="num">{money(a.balance)}</strong>
						<span class="iban">{a.iban.replace(/(.{4})/g, '$1 ').trim()}</span>
					</span>
				</div>
			{/each}
		</div>

		<section class="tiles">
			<div class="card tile">
				<span class="head"><span class="label">Inkomsten</span>
					<InfoTip label="inkomsten">
						Wat er deze maand binnenkwam.
						{#if data.income.expected}Verwacht: {money(data.income.expected)}{data.income.note ? `, ${data.income.note}` : ''}.{:else}Vul onderaan bij Inkomsten in wat je verwacht, dan kun je vooruit plannen.{/if}
					</InfoTip>
				</span>
				<strong class="num">{money(data.income.received)}</strong>
			</div>
			<div class="card tile">
				<span class="head"><span class="label">Uitgaven</span>
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
			<div class="todos">
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
			<MonthList groups={data.rows} month={data.month} />
		</section>

		{#if data.incomeRows.length}
			<section>
				<div class="section-head"><h2>Inkomsten</h2></div>
				<MonthList groups={[{ group: data.incomeRoot, rows: data.incomeRows }]} month={data.month} header={false} income />
			</section>
		{/if}
		<p class="muted small asof">Saldi op {shortDate(data.balanceDate)}, volgens de laatste upload.</p>
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

	.hero {
		display: flex;
		gap: 14px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		margin: -6px -16px -18px;
		padding: 6px 16px 26px;
		scrollbar-width: none;
	}
	.hero::-webkit-scrollbar {
		display: none;
	}
	.balance {
		flex: 0 0 272px;
		min-height: 196px;
		scroll-snap-align: start;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 18px;
		padding: 22px;
		border-radius: 26px;
		position: relative;
		overflow: hidden;
	}
	.balance {
		background: var(--gradient);
		color: #fff;
		box-shadow: 0 14px 34px rgb(106 85 220 / 0.28);
	}
	.balance::after {
		content: '';
		position: absolute;
		inset: -40% -20% auto auto;
		width: 80%;
		aspect-ratio: 1;
		border-radius: 50%;
		background: radial-gradient(circle, rgb(255 255 255 / 0.18), transparent 65%);
	}
	.balance.alt {
		background: var(--gradient-2);
		box-shadow: 0 14px 34px rgb(80 72 207 / 0.25);
	}
	.b-name {
		font-size: 15px;
		font-weight: 500;
		opacity: 0.9;
	}
	.b-foot {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.balance strong {
		font-size: 32px;
		font-weight: 700;
		letter-spacing: -0.035em;
		line-height: 1.1;
	}
	.iban {
		font-size: 12px;
		letter-spacing: 0.12em;
		opacity: 0.75;
	}
	/* Wat nog moet gebeuren: compacte regels in de waarschuwingskleur. */
	.todos {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 10px;
	}
	.todo {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: 16px;
		background: var(--warn-soft);
		color: var(--text);
		transition: background-color 0.15s;
	}
	.todo:hover {
		background: color-mix(in srgb, var(--warn-soft) 80%, var(--warn) 8%);
	}
	.t-icon {
		flex: none;
		display: grid;
		place-items: center;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--surface);
		color: var(--warn);
	}
	.t-text {
		flex: 1;
		min-width: 0;
		font-size: 14px;
		color: var(--muted);
	}
	.t-text strong {
		color: var(--text);
		font-weight: 650;
	}
	.t-go {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 2px;
		font-weight: 600;
		font-size: 14px;
		color: var(--warn);
	}
	@media (min-width: 860px) {
		.hero {
			margin: -6px 0 -18px;
			padding: 6px 0 26px;
			overflow: visible;
			flex-wrap: wrap;
		}
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 14px;
	}
	@media (min-width: 900px) {
		.tiles {
			grid-template-columns: repeat(4, 1fr);
		}
	}
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 3px;
		padding: 18px;
	}
	.label {
		color: var(--accent);
		font-size: 14px;
		font-weight: 600;
	}
	.tile strong {
		font-size: 26px;
		font-weight: 700;
		letter-spacing: -0.03em;
	}

	.tile .head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.asof {
		margin: -10px 4px 0;
	}
</style>
