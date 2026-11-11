<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { goto } from '$app/navigation';
	import { money, moneyInput, parseMoney, shortDate } from '$lib/format';

	let { data, form } = $props();

	// De cijfers voor een andere datum laden we kort na het kiezen, niet op het moment van opslaan;
	// anders kan het herladen het opslaan onderbreken.
	let timer: ReturnType<typeof setTimeout> | undefined;
	function preview(date: string) {
		clearTimeout(timer);
		if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
		timer = setTimeout(() => goto(`?datum=${date}`, { keepFocus: true, noScroll: true, replaceState: true }), 400);
	}

	const initial = () => Object.fromEntries(data.pots.map((p) => [p.id, p.opening_cents ? moneyInput(p.opening_cents) : '']));
	let values = $state<Record<number, string>>(initial());

	const total = $derived(Object.values(values).reduce((s, v) => s + (parseMoney(v) ?? 0), 0));
	const rest = $derived(data.balance - total);
</script>

<svelte:head><title>Startsaldo · Stax</title></svelte:head>

<form method="POST" class="stack">
	<header>
		<a class="link back" href="/instellingen"><Icon name="left" size={18} /> Instellingen</a>
		<h1>Startsaldo verdelen</h1>
		<p class="muted">
			Kies vanaf welke dag Stax de spaarsaldi bijhoudt en geef aan hoeveel er op die dag al bij elk budget dat spaart stond. Alles wat daarna op de spaarrekening
			binnenkomt of eraf gaat, wordt per boeking aan een budget gekoppeld.
		</p>
	</header>

	{#if form?.error}<p class="banner">{form.error}</p>{/if}

	<label class="field date">
		Startdatum
		<input
			type="date"
			name="startdatum"
			value={data.startdatum}
			oninput={(e) => preview(e.currentTarget.value)}
		/>
	</label>

	<label class="field incomepot">
		Inkomsten op de spaarrekening
		<select name="inkomstenpot" value={data.incomePot ? String(data.incomePot) : ''}>
			<option value="">Niet bij inkomsten, altijd een budget kiezen</option>
			{#each data.pots as p (p.id)}<option value={String(p.id)}>Naar {p.name}</option>{/each}
		</select>
		<span class="muted small">
			Rente en ander geld dat direct op de spaarrekening binnenkomt, kun je bij inkomsten zetten. Het geld zelf komt dan bij dit budget, zodat de
			spaarsaldi blijven kloppen met de bank.
		</span>
	</label>

	<div class="card summary">
		<div><span class="muted small">Op de spaarrekening aan het begin van {shortDate(data.startdatum)}</span><strong class="num">{money(data.balance)}</strong></div>
		<div><span class="muted small">Verdeeld over budgetten</span><strong class="num">{money(total)}</strong></div>
		<div class:ok={rest === 0} class:off={rest !== 0}>
			<span class="small">{rest === 0 ? 'Alles verdeeld' : rest > 0 ? 'Nog te verdelen' : 'Te veel verdeeld'}</span>
			<strong class="num">{money(Math.abs(rest))}</strong>
		</div>
	</div>

	<ul class="card pots">
		{#each data.pots as p (p.id)}
			<li style:--depth={p.depth}>
				<label for="pot_{p.id}" class:group={p.isGroup}>
					{#if p.context}<span class="muted">{p.context} ›</span>{/if}
					{p.name}
					{#if p.isGroup}<span class="muted small">algemeen</span>{/if}
				</label>
				<div class="amount">
					<input id="pot_{p.id}" name="pot_{p.id}" inputmode="decimal" placeholder="0,00" bind:value={values[p.id]} />
					{#if rest > 0}
						<button type="button" class="ghost small" onclick={() => (values[p.id] = moneyInput((parseMoney(values[p.id]) ?? 0) + rest))}>
							+ rest
						</button>
					{/if}
				</div>
			</li>
		{:else}
			<li class="empty small">Er zijn nog geen budgetten die sparen. Zet bij een budget de optie “Spaart” aan.</li>
		{/each}
	</ul>

	<div class="foot">
		<button class="primary">Opslaan</button>
		{#if rest !== 0}<span class="muted small">Opslaan mag ook als het nog niet precies klopt; de pagina Sparen laat het verschil zien.</span>{/if}
	</div>
</form>

<style>
	header p {
		margin: 6px 0 0;
		max-width: 62ch;
	}
	header h1 {
		margin-top: 6px;
	}
	.date {
		max-width: 220px;
	}
	.incomepot {
		max-width: 62ch;
	}
	.incomepot select {
		max-width: 320px;
	}
	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	}
	.summary > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 14px;
	}
	.summary strong {
		font-size: 20px;
		font-weight: 650;
	}
	.summary .ok {
		color: var(--accent);
		background: var(--accent-soft);
	}
	.summary .off {
		background: var(--warn-soft);
	}
	.pots {
		list-style: none;
		margin: 0;
		padding: 4px 0;
	}
	.pots li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 14px;
	}
	.pots li + li {
		border-top: 1px solid var(--line);
	}
	label.group {
		font-weight: 620;
	}
	.amount {
		display: flex;
		gap: 4px;
		align-items: center;
	}
	.amount input {
		width: 140px;
		text-align: right;
	}
	.amount button {
		min-height: 32px;
		padding: 0 8px;
	}
	.foot {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
</style>
