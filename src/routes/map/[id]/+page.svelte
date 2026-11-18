<script lang="ts">
	import { Terugknop } from 'vertex/web';
	import { afterNavigate } from '$app/navigation';
	import AreaChart from '$lib/components/AreaChart.svelte';
	import MonthList from '$lib/components/MonthList.svelte';
	import PeriodBar from '$lib/components/PeriodBar.svelte';
	import BudgetCell from '$lib/components/BudgetCell.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import InfoTip from '$lib/components/InfoTip.svelte';
	import { goalDateText, money, monthName, shortDate } from '$lib/format';
	import { kindLabel } from '$lib/types';

	let { data } = $props();

	// Terug naar de pagina waar je vandaan kwam; tussen detailpagina's onderling blijft dat dezelfde.
	const ORIGINS: [string, string][] = [['/sparen', 'Sparen'], ['/boekingen', 'Boekingen'], ['/instellingen', 'Instellingen']];
	let origin = $state<{ href: string; label: string } | null>(null);
	afterNavigate(({ from }) => {
		const p = from?.url.pathname;
		if (!p || p.startsWith('/map/')) return;
		const label = p === '/' ? 'Budgetoverzicht' : ORIGINS.find(([pre]) => p.startsWith(pre))?.[1];
		if (label) origin = { href: p + from!.url.search, label };
	});
	const back = $derived(
		origin ?? (data.stats.isPot ? { href: `/sparen`, label: 'Sparen' } : { href: `/?maand=${data.month}`, label: 'Budgetoverzicht' })
	);

	const sinceText = (m: string) => (m === '0000-00' ? 'vanaf het begin' : `sinds ${monthName(m)}`);
	const s = $derived(data.stats);
	const f = $derived(data.figures);
	const goal = $derived(s.goal);
	const isBudget = $derived(f.kind === 'budget');
	const isIncome = $derived(f.kind === 'inkomsten');
	const RING = 2 * Math.PI * 42;
	const shortMonth = (m: string) => monthName(m, false).slice(0, 3) + (m.endsWith('-01') ? ` '${m.slice(2, 4)}` : '');

	// Ring: bij een budget hoeveel er op is, bij een doelpot hoe ver het doel is.
	const ring = $derived(
		isBudget && f.budgeted
			? { pct: Math.max(0, f.spent) / f.budgeted, text: `${Math.round((Math.max(0, f.spent) / f.budgeted) * 100)}%`, sub: 'op' }
			: goal
				? { pct: goal.progress, text: `${Math.round(goal.progress * 100)}%`, sub: 'van doel' }
				: null
	);

	const chart = $derived(
		isIncome
			? { label: 'Ontvangen per maand', mode: 'columns' as const, points: data.history.map((h) => ({ label: shortMonth(h.month), value: h.spent })), reference: null }
			: isBudget
				? {
						label: 'Uitgegeven per maand',
						mode: 'columns' as const,
						// Elke kolom krijgt het budget van zijn eigen maand als streepje.
						points: data.history.map((h) => ({ label: shortMonth(h.month), value: h.spent, target: h.budgeted })),
						reference: null
					}
				: {
						label: 'Balans aan het eind van elke maand',
						mode: 'area' as const,
						points: data.history.map((h) => ({ label: shortMonth(h.month), value: h.balance ?? 0 })),
						reference: goal ? { value: goal.target, label: 'doel' } : null
					}
	);
	const amount = (v: number | null) => money(v ?? 0);
</script>

<svelte:head><title>{data.node.name} · Stax</title></svelte:head>

<div class="stack">
	<header class="top">
		<Terugknop href={back.href}>{back.label}</Terugknop>
		<!-- Instellen gebeurt op één plek: Instellingen → Budgetten. -->
		<a class="btn" href="/instellingen/budgetten?bewerk={data.node.id}"><Icon name="settings" size={16} /> Instellen</a>
	</header>

	<section class="hero">
		<div class="hero-main">
			<span class="avatar big"><Icon name={data.node.depth === 0 ? 'folder' : s.icon} size={28} /></span>
			<div>
				{#if data.node.path.length}<span class="crumb">{data.node.path.join(' › ')}</span>{/if}
				<h1>{data.node.name}</h1>
				<span class="where">
					{#if data.node.group}Groep · {data.node.count} {data.node.count === 1 ? 'budget' : 'budgetten'}{:else}{isIncome ? 'Inkomsten' : kindLabel(f.kind as never)}{#if !isBudget && !isIncome}{s.funding === 'spaar' ? ' · op de spaarrekening' : ' · op de betaalrekening'}{/if}{/if}
				</span>
			</div>
		</div>
		<div class="hero-balance">
			{#if isIncome}
				<span>Ontvangen in {monthName(data.month, false)}</span>
				<strong class="num">{money(f.spent)}</strong>
			{:else if data.node.group}
				<span>Uitgegeven in {monthName(data.month, false)}</span>
				<strong class="num">{money(f.spent)}</strong>
			{:else if isBudget}
				<span>{f.balance == null ? `Uitgegeven in ${monthName(data.month, false)}` : f.balance < 0 ? 'Te veel uitgegeven' : 'Nog over deze maand'}</span>
				<strong class="num">{money(f.balance == null ? f.spent : Math.abs(f.balance))}</strong>
			{:else}
				<span>Balans</span>
				<strong class="num">{money(f.balance)}</strong>
			{/if}
		</div>
		{#if ring}
			<div class="ring">
				<svg viewBox="0 0 100 100" role="img" aria-label="{ring.text} {ring.sub}">
					<circle cx="50" cy="50" r="42" fill="none" stroke="rgb(255 255 255 / 0.25)" stroke-width="10" />
					{#if ring.pct > 0}
						<circle
							cx="50"
							cy="50"
							r="42"
							fill="none"
							stroke={ring.pct > 1 && isBudget ? '#ffb3ad' : '#fff'}
							stroke-width="10"
							stroke-linecap="round"
							stroke-dasharray="{Math.min(1, ring.pct) * RING} {RING}"
							transform="rotate(-90 50 50)"
						/>
					{/if}
					<text x="50" y="47" text-anchor="middle">{ring.text}</text>
					<text x="50" y="63" text-anchor="middle" class="sub">{ring.sub}</text>
				</svg>
				{#if goal}
					<div class="goaltext">
						<span>Doel {money(goal.target)}{#if goal.date}{` ${goalDateText(goal.date)}`}{/if}</span>
						{#if goal.expected !== null}<span>Volgens schema nu {money(goal.expected)}</span>{/if}
						{#if goal.monthsLeft}<span>Nog {money(goal.perMonth)} per maand nodig</span>{/if}
					</div>
				{/if}
			</div>
		{/if}
	</section>

	{#if !isIncome}
		<section class="tiles">
			<div class="card tile">
				<span class="label">Gebudgetteerd</span>
				<strong class="num">{amount(f.kind === 'budget' ? f.budgeted : f.planned)}</strong>
				<span class="muted small">
					{#if data.node.group}Optelsom van de budgetten eronder{:else if data.budget.override !== null}Afwijkend in {monthName(data.month, false)}{:else if data.budget.template}Standaard, {sinceText(data.budget.template.since)}{:else}Nog geen bedrag{/if}
				</span>
				{#if data.budget.editable}
					<span class="edit"><BudgetCell node={s} month={data.month} variant="button"><Icon name="edit" size={15} /> Aanpassen</BudgetCell></span>
				{/if}
			</div>
			{#if !isBudget}
				<div class="card tile">
					<span class="label">Erin</span>
					<strong class="num" class:pos={f.budgeted}>{f.budgeted ? `+${money(f.budgeted)}` : amount(0)}</strong>
				</div>
			{/if}
			<div class="card tile">
				<span class="label">Uitgegeven</span>
				<strong class="num">{money(f.spent)}</strong>
				{#if f.spent < 0}<span class="muted small">meer terug dan uitgegeven</span>{/if}
				{#if s.outside}<span class="muted small">waarvan {money(-s.outside)} van de lopende rekening, niet van het saldo</span>{/if}
			</div>
			<div class="card tile">
				<span class="label">Balans</span>
				<strong class="num" class:neg={f.balance != null && f.balance < 0}>{amount(f.balance)}</strong>
				{#if s.toWithdraw}
					<span class="muted small">
						nog {money(s.toWithdraw)} op te nemen van de spaarrekening
						<InfoTip label="nog op te nemen">
							Je hebt dit bedrag voorgeschoten van de lopende rekening, terwijl het uit deze pot komt. Het geld staat nog op de spaarrekening. Maak het over en koppel die opname aan dit budget; dan verdwijnt deze regel.
						</InfoTip>
					</span>
				{/if}
			</div>
			{#if goal?.expected != null && f.balance != null}
				<div class="card tile">
					<span class="label">Ten opzichte van schema</span>
					<strong class="num" class:pos={f.balance >= goal.expected} class:neg={f.balance < goal.expected}>
						{money(f.balance - goal.expected || 0, true)}
					</strong>
					<span class="muted small">{f.balance >= goal.expected ? 'voor' : 'achter'} op schema</span>
				</div>
			{/if}
		</section>

	{/if}

	{#if data.children.length}
		<section>
			<div class="section-head"><h2>Budgetten in deze groep</h2></div>
			<MonthList groups={[{ group: s, rows: data.children }]} month={data.month} header={false} />
		</section>
	{/if}

	<section class="card chartcard">
		<div class="section-head">
			<h2>{chart.label}</h2>
			{#if isBudget}<span class="legend muted small"><span class="tick"></span> budget van die maand</span>{/if}
		</div>
		<AreaChart label="{chart.label} voor {data.node.name}" points={chart.points} mode={chart.mode} reference={chart.reference} format={(v) => money(v)} />
	</section>

	<div class="cols">
		<section>
			<div class="section-head"><h2>Per maand</h2></div>
			<div class="card tablewrap">
				<table>
					<thead>
						<tr>
							<th>Maand</th>
							{#if isIncome}<th>Ontvangen</th>{:else if isBudget}<th>Gebudgetteerd</th><th>Uitgegeven</th><th>Balans</th>{:else}<th>Gebudgetteerd</th><th>Erin</th><th>Uitgegeven</th><th>Balans</th>{/if}
						</tr>
					</thead>
					<tbody>
						{#each [...data.history].reverse() as h (h.month)}
							<tr class:current={h.month === data.month}>
								<td><a href="?maand={h.month}">{monthName(h.month)}</a></td>
								{#if isIncome}
									<td class="num pos">{money(h.spent)}</td>
								{:else}
									{@const plan = isBudget ? h.budgeted : h.planned}
									<td class="num">
										{#if h.deviates}<span class="chip warn dev" title="Afwijkend bedrag voor deze maand">afwijkend</span>{/if}
										{amount(plan)}
									</td>
									{#if !isBudget}<td class="num pos">{h.budgeted ? `+${money(h.budgeted)}` : amount(0)}</td>{/if}
									<td class="num">{amount(h.spent)}</td>
									<td class="num strong" class:neg={h.balance != null && h.balance < 0}>{amount(h.balance)}</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>

		<section>
			<div class="section-head">
				<h2>Boekingen in {monthName(data.month, false)}</h2>
				<a class="link small" href="/boekingen?map={data.node.id}&maand=">Alle</a>
			</div>
			<ul class="group">
				{#each data.bookings as b, i (`${b.id}-${i}`)}
					<li class="item">
						<span class="bk-main">
							<span class="bk-who">{b.transfer_account_id ? `Inleg: ${b.description || 'overboeking'}` : b.counterparty || b.description}</span>
							<span class="muted small">{shortDate(b.booking_date)}{#if data.showCategory}{` · ${b.category}`}{/if}</span>
						</span>
						<span class="num" class:pos={b.amount_cents > 0}>{b.amount_cents > 0 ? '+' : ''}{money(b.amount_cents)}</span>
					</li>
				{:else}
					<li class="empty small">Geen boekingen in deze maand.</li>
				{/each}
			</ul>
		</section>
	</div>
	<PeriodBar month={data.month} budget={{ id: data.node.id, prev: data.nav.prev, next: data.nav.next, groups: data.nav.groups, options: data.options }} />
</div>

<style>
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 12px;
	}
	.hero {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--ruimte-6) var(--ruimte-10);
		padding: 28px;
		border-radius: var(--vorm-xxl);
		background: var(--verloop-accent);
		color: var(--tekst-op-accent);
		box-shadow: var(--schaduw-accent);
	}
	.hero-main {
		display: flex;
		align-items: center;
		gap: 16px;
		flex: 1 1 260px;
	}
	/* Op de gradient een wit icoon in een doorschijnende cirkel, zoals in de app. */
	.avatar.big {
		width: 60px;
		height: 60px;
		background: rgb(255 255 255 / 0.2);
		color: #fff;
	}
	.crumb,
	.where {
		display: block;
		font-size: 14px;
		opacity: 0.85;
	}
	.hero h1 {
		font: 700 28px/34px var(--tekst-familie);
	}
	.hero-balance {
		display: flex;
		flex-direction: column;
	}
	.hero-balance span {
		opacity: 0.85;
		font-size: 14px;
	}
	.hero-balance strong {
		font: 700 34px/40px var(--tekst-familie);
	}
	.ring {
		display: flex;
		align-items: center;
		gap: 14px;
		font-size: 14px;
	}
	.ring svg {
		width: 92px;
	}
	.ring text {
		fill: #fff;
		font-size: 21px;
		font-weight: 700;
	}
	.ring text.sub {
		font-size: 10px;
		font-weight: 500;
		opacity: 0.85;
	}
	.goaltext {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.goaltext span + span {
		opacity: 0.85;
	}
	.tiles {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--ruimte-4);
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: var(--ruimte-2);
		padding: var(--ruimte-5);
	}
	.label {
		color: var(--muted);
		font: 600 15px/22px var(--tekst-familie);
	}
	.tile {
		position: relative;
	}
	.edit {
		align-self: flex-start;
	}
	.dev {
		margin-right: 6px;
		font-size: 11px;
		padding: 1px 7px;
	}
	.tile strong {
		font: 700 28px/34px var(--tekst-familie);
	}
	.chartcard {
		padding: var(--ruimte-6);
	}
	.chartcard .section-head {
		margin: 0 0 8px;
	}
	.legend {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.tick {
		width: 16px;
		border-top: 2px solid var(--text);
		opacity: 0.55;
	}
	.chartcard h2 {
		font: 700 22px/28px var(--tekst-familie);
	}
	.cols {
		display: grid;
		gap: var(--ruimte-6);
	}
	@media (min-width: 1000px) {
		.cols {
			grid-template-columns: 1fr 1fr;
			align-items: start;
		}
	}
	.tablewrap {
		overflow-x: auto;
		padding: 4px 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 15px;
	}
	th {
		text-align: right;
		font: 600 12px/16px var(--tekst-familie);
		color: var(--muted);
		padding: var(--ruimte-3) var(--ruimte-5);
		border-bottom: 1px solid var(--line);
	}
	td {
		text-align: right;
		padding: 11px var(--ruimte-5);
	}
	th:first-child,
	td:first-child {
		text-align: left;
		text-transform: capitalize;
	}
	tr.current td {
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
	}
	td a:hover {
		color: var(--accent);
	}
	.strong {
		font-weight: 600;
	}
	.item {
		justify-content: space-between;
	}
	.bk-main {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.bk-who {
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
