<script lang="ts">
	import BudgetCell from './BudgetCell.svelte';
	import Icon from './Icon.svelte';
	import { amount as fmt } from '$lib/format';
	import { figures, type Figures } from '$lib/figures';
	import { kindOf, kindTag, type NodeStats } from '$lib/types';

	// Alle potten van één maand als brede rijen: gebudgetteerd, wat erin en eruit ging, en de balans (zoals in Actual).
	// Budgetten met budgetten eronder staan als totaalrij, met de onderliggende rijen ingesprongen eronder.
	type Row = { node: NodeStats; level: number; parent: boolean };
	// Bij inkomsten zijn de kolommen verwacht · ontvangen · verschil.
	let {
		groups,
		month,
		header = true,
		income = false
	}: { groups: { group: NodeStats; rows: Row[] }[]; month: string; header?: boolean; income?: boolean } = $props();

	function totals(rows: Row[]) {
		let plan = 0;
		let net = 0;
		let balance = 0;
		for (const r of rows) {
			if (r.parent) continue;
			const f = figures(r.node);
			plan += f.plan ?? 0;
			net += f.net;
			balance += f.balance ?? 0;
		}
		return { plan, net, balance };
	}

	/** Cijfers van een rij; een totaalrij telt de rijen eronder op. */
	function rowFigures(rows: Row[], i: number): Figures {
		const r = rows[i];
		if (!r.parent) return figures(r.node);
		const below: Row[] = [];
		for (let j = i + 1; j < rows.length && rows[j].level > r.level; j++) below.push(rows[j]);
		const t = totals(below);
		const kind = r.node.tree === 'inkomsten' ? 'inkomsten' : kindOf(r.node);
		return { kind, budgeted: t.plan, planned: null, plan: t.plan, net: t.net, spent: -t.net, balance: t.balance, bar: null };
	}

	/** Inkomsten: balk met ontvangen van verwacht. */
	function incomeBar(f: Figures): Figures['bar'] {
		if (!f.plan) return null;
		return { pct: (f.net / f.plan) * 100, over: false, warn: false, text: `${amount(f.net)} van ${amount(f.plan)}` };
	}
	const third = (f: Figures) => (income ? f.net - (f.plan ?? 0) : (f.balance ?? 0));

	// Onder de naam alleen de opties van een budget (spaart, doel); een gewoon budget heeft niets extra's.
	const rhythm = (f: Figures) => kindTag(f.kind);

	const link = (r: Row) => `/map/${r.node.id}?maand=${month}`;
	// Een groep is een optelsom; alleen budgetten hebben een eigen bedrag.
	const editable = (r: Row) => !r.parent && r.node.depth > 0;
	// In de lijst zonder euroteken; dat houdt het rustig.
	const amount = (v: number | null) => fmt(v ?? 0);
	// Erin met een plus, eruit met een min.
	const signed = (v: number) => fmt(v, true);
</script>

<div class="monthlist">
	<div class="cols head" aria-hidden="true">
		<span></span>
		<span></span>
		<span class="r">{income ? 'Verwacht' : 'Gebudgetteerd'}</span>
		<span class="r">{income ? 'Ontvangen' : 'Erin / eruit'}</span>
		<span class="r">{income ? 'Verschil' : 'Balans'}</span>
		<span></span>
	</div>
	{#each groups as { group, rows } (group.id)}
		{@const t = totals(rows)}
		<section class="block">
			{#if header}<a class="cols ghead" href="/map/{group.id}?maand={month}">
				<span class="who">
					<span class="avatar sm"><Icon name={group.icon} size={18} /></span>
					<strong>{group.name}</strong>
				</span>
				<span></span>
				<span class="r num budgeted" class:zero={!t.plan}>{amount(t.plan)}</span>
				<span class="r num spentv" class:zero={t.net >= 0}>{signed(t.net)}</span>
				<span class="r num gbal" class:neg={t.balance < 0} class:zero={!t.balance}>{amount(t.balance)}</span>
				<Icon name="right" size={16} />
			</a>{/if}
			<ul>
				{#each rows as r, i (r.node.id)}
					{@const f = rowFigures(rows, i)}
					{@const bar = income ? incomeBar(f) : f.bar}
					{@const last = third(f)}
					<li>
						<div class="cols row" class:parent={r.parent} style:--level={r.level}>
							<a class="who" href={link(r)}>
								<span class="avatar soft sm"><Icon name={r.node.icon} size={17} /></span>
								<span class="names">
									<strong>{r.node.name}</strong>
									<span class="sub muted small">
										{#if r.parent}Groep · {r.node.children.length} {r.node.children.length === 1 ? 'budget' : 'budgetten'}{:else if income}{r.node.budgetOverride ? 'Wijkt deze maand af' : r.node.budgetTemplate ? 'Elke maand' : 'Nog niets verwacht'}{:else}{rhythm(f)}{/if}
									</span>
								</span>
							</a>
							<span class="progress">
								{#if bar}
									<span class="bar" class:over={bar.over} class:quiet={f.kind === 'spaarpot'}>
										<span style:width="{Math.min(100, Math.max(0, bar.pct))}%"></span>
									</span>
									<span class="small muted bartext" class:warn={bar.warn}>{bar.text}</span>
								{/if}
							</span>
							{#snippet budgetedValue()}
								{amount(f.plan)}
							{/snippet}
							<span class="r num budgeted" class:zero={!f.plan}>
								{#if editable(r)}<BudgetCell node={r.node} {month}>{@render budgetedValue()}</BudgetCell>{:else}{@render budgetedValue()}{/if}
							</span>
							<span class="r num spentv" class:zero={f.net >= 0}>{income ? amount(f.net) : signed(f.net)}</span>
							<span class="r num bal" class:neg={!income && last < 0} class:zero={income ? last >= 0 : !last}>{income ? signed(last) : amount(last)}</span>
							<span class="figs small num">
								{#if editable(r)}
									<span class="muted"><BudgetCell node={r.node} {month}>{income ? 'verwacht' : 'budget'} {amount(f.plan)}</BudgetCell></span>
									{:else if f.plan}<span class="muted">{income ? 'verwacht' : 'budget'} {amount(f.plan)}</span>{/if}
									{#if income}<span class="muted">ontvangen {amount(f.net)}</span>
									{:else if f.net}<span class:muted={f.net > 0}>{f.net > 0 ? 'erin' : 'eruit'} {amount(Math.abs(f.net))}</span>{/if}
							</span>
							<Icon name="right" size={16} />
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<style>
	.monthlist {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.cols {
		display: grid;
		grid-template-columns: minmax(200px, 1.6fr) minmax(140px, 1.3fr) 130px 130px 140px 16px;
		align-items: center;
		gap: 18px;
	}
	.head {
		padding: 0 16px;
		font-size: 12.5px;
		font-weight: 500;
		color: var(--muted);
	}
	.r {
		text-align: right;
	}
	.block {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		overflow: hidden;
	}
	.ghead {
		padding: 16px 16px 10px;
		transition: background-color 0.15s;
	}
	.ghead:hover {
		background: var(--surface-2);
	}
	.ghead strong {
		font-size: 17px;
		font-weight: 650;
	}
	.gbal {
		font-weight: 650;
		font-size: 16px;
	}
	.ghead > :global(svg),
	.row > :global(svg) {
		color: var(--faint);
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0 0 6px;
	}
	.block > ul:first-child {
		padding-top: 6px;
	}
	li + li .row::before {
		content: '';
		position: absolute;
		top: 0;
		left: calc(60px + var(--level, 0) * 28px);
		right: 0;
		border-top: 0.5px solid var(--line);
	}
	.row {
		position: relative;
		padding: 13px 16px;
		transition: background-color 0.15s;
	}
	.row:hover {
		background: var(--surface-2);
	}
	/* De naam is de link, maar de hele rij is klikbaar; het budgetvakje ligt erboven. */
	.row .who::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.row .who {
		padding-left: calc(var(--level, 0) * 28px);
	}
	.row.parent .names strong {
		font-weight: 650;
	}
	.who {
		display: flex;
		align-items: center;
		gap: 12px;
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
	.names strong {
		font-weight: 560;
	}
	.progress {
		display: flex;
		flex-direction: column;
		gap: 5px;
		min-width: 0;
	}
	.bar.quiet > span {
		background: color-mix(in srgb, var(--accent) 45%, transparent);
	}
	.bartext {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bartext.warn {
		color: var(--warn);
	}
	/* Nullen en geld dat erin komt zijn grijs; de rest staat in de gewone tekstkleur. */
	.zero {
		color: var(--muted);
	}
	.bal {
		font-size: 16px;
		font-weight: 650;
		letter-spacing: -0.015em;
	}
	.figs {
		display: none;
	}

	/* Smaller scherm: naam en balans boven, balk en cijfers eronder. */
	@media (max-width: 900px) {
		.head {
			display: none;
		}
		.cols {
			grid-template-columns: 1fr auto 16px;
			grid-template-areas:
				'who bal chev'
				'progress progress progress'
				'figs figs figs';
			gap: 6px 12px;
		}
		.ghead {
			grid-template-areas: 'who bal chev';
		}
		.ghead > span:nth-child(2),
		.budgeted,
		.spentv {
			display: none;
		}
		.who {
			grid-area: who;
		}
		.bal,
		.gbal {
			grid-area: bal;
		}
		.row > :global(svg),
		.ghead > :global(svg) {
			grid-area: chev;
		}
		.progress {
			grid-area: progress;
			padding-left: calc(44px + var(--level, 0) * 28px);
		}
		.progress:empty {
			display: none;
		}
		.figs {
			grid-area: figs;
			display: flex;
			gap: 12px;
			padding-left: calc(44px + var(--level, 0) * 28px);
		}
		.figs:empty {
			display: none;
		}
	}
</style>
