<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount, tick } from 'svelte';
	import CategoryCombo from '$lib/components/CategoryCombo.svelte';
	import CategoryPicker from '$lib/components/CategoryPicker.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { dayLabel, money, moneyInput, monthName, parseMoney, shortDate } from '$lib/format';
	import type { CatOption } from '$lib/types';
	import type { Row } from './+page.server';

	let { data } = $props();

	const labels = $derived(new Map(data.options.map((o) => [o.id, o.label])));
	// Spaarpotten: daar kan een uitgave ook van de lopende rekening komen zonder dat het geld uit de pot gaat.
	const savingsIds = $derived(new Set(data.options.filter((o) => o.savings).map((o) => o.id)));
	const onPot = (row: Row) => row.amount_cents < 0 && row.transfer_account_id == null && !row.needsPot && row.splits.some((s) => savingsIds.has(s.category_id));
	const outsidePot = (row: Row) => onPot(row) && row.splits.some((s) => s.from_pot === 0);
	const accountName = $derived(new Map(data.accounts.map((a) => [a.id, a.name])));
	// Nog terug te krijgen voor een uitgave, of 0.
	const refundLeft = (row: Row) => (row.refund_expected ? Math.max(0, row.refund_expected - row.refund_received) : 0);

	const groups = $derived.by(() => {
		const out: { date: string; rows: Row[] }[] = [];
		for (const r of data.rows) {
			if (out.at(-1)?.date !== r.booking_date) out.push({ date: r.booking_date, rows: [] });
			out.at(-1)!.rows.push(r);
		}
		return out;
	});

	function setFilter(key: string, value: string | number | null) {
		const url = new URL(page.url);
		if (value === null || value === '') url.searchParams.delete(key);
		else url.searchParams.set(key, String(value));
		goto(url, { keepFocus: true, noScroll: true, replaceState: true });
	}

	let search = $state(page.url.searchParams.get('q') ?? '');
	let searchTimer: ReturnType<typeof setTimeout>;
	function onSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(() => setFilter('q', search.trim()), 300);
	}

	// --- Weergave: lijst (telefoon) of tabel (desktop) ---
	let view = $state<'lijst' | 'tabel'>('lijst');
	onMount(() => {
		let saved: string | null = null;
		try {
			saved = localStorage.getItem('stax-boekingen-weergave');
		} catch {}
		// Op de telefoon altijd de lijst; de tabel past daar niet.
		if (window.innerWidth < 860) view = 'lijst';
		else view = saved === 'lijst' || saved === 'tabel' ? saved : 'tabel';
	});
	function setView(v: 'lijst' | 'tabel') {
		view = v;
		try {
			localStorage.setItem('stax-boekingen-weergave', v);
		} catch {}
	}

	// --- Tabel: snel indelen per rij en meerdere tegelijk ---
	let learn = $state(true);
	let busyId = $state<number | null>(null);
	let selected = $state<Set<number>>(new Set());
	let bulkCat = $state('');

	async function post(action: string, fields: Record<string, string>) {
		const body = new FormData();
		for (const [k, v] of Object.entries(fields)) body.set(k, v);
		const res = await fetch(`?/${action}`, { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
		const result = deserialize(await res.text());
		await invalidateAll();
		return result;
	}

	async function quick(row: Row, id: number | null) {
		const value = id ? String(id) : '';
		busyId = row.id;
		const result = await post('snel', { id: String(row.id), category_id: value, ...(learn && value && !row.withdrawal ? { remember: '1' } : {}) });
		busyId = null;
		if (result.type === 'failure') message = String(result.data?.error ?? 'Opslaan lukte niet.');
		else {
			const applied = result.type === 'success' ? Number(result.data?.applied ?? 0) : 0;
			message = applied > 0 ? `Ook ${applied} andere ${applied === 1 ? 'boeking' : 'boekingen'} automatisch ingedeeld.` : '';
		}
	}

	async function bulk(fields: Record<string, string>) {
		const result = await post('bulk', { ids: [...selected].join(','), ...fields });
		if (result.type === 'success') {
			const n = Number(result.data?.bulk ?? 0);
			message = `${n} ${n === 1 ? 'boeking' : 'boekingen'} bijgewerkt.`;
			selected = new Set();
			bulkCat = '';
		} else if (result.type === 'failure') message = String(result.data?.error ?? 'Dat lukte niet.');
	}

	function toggle(id: number) {
		const next = new Set(selected);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selected = next;
	}
	const allSelected = $derived(data.rows.length > 0 && data.rows.every((r) => selected.has(r.id)));
	function toggleAll() {
		selected = allSelected ? new Set() : new Set(data.rows.map((r) => r.id));
	}

	// --- Indelen ---
	let dialog = $state() as HTMLDialogElement;
	let form = $state() as HTMLFormElement;
	let current = $state<Row | null>(null);
	// De rij boekingen waar het venster doorheen bladert; blijft staan zolang het venster open is.
	let queue = $state<Row[]>([]);
	let pos = $state(0);
	let mode = $state<'single' | 'split'>('single');
	let parts = $state<{ category_id: number | null; amount: string }[]>([]);
	let remember = $state(true);
	let excluded = $state(false);
	let note = $state('');
	let fromPot = $state(true);
	let refundOn = $state(false);
	let refundAmount = $state('');
	let splitsJson = $state('[]');
	let message = $state('');
	let error = $state('');

	function openFromList(row: Row, split = false) {
		queue = [...data.rows];
		pos = queue.findIndex((r) => r.id === row.id);
		open(row);
		// Via de splitsknop meteen in twee delen beginnen, ook als de boeking nog niet is ingedeeld.
		if (split && mode !== 'split') startSplit();
	}

	function go(delta: number) {
		const next = queue[pos + delta];
		if (!next) return;
		pos += delta;
		open(next);
	}

	function onKey(e: KeyboardEvent) {
		if (!current || mode === 'split') return;
		const tag = (e.target as HTMLElement).tagName;
		if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
		if (e.key === 'ArrowLeft') go(-1);
		if (e.key === 'ArrowRight') go(1);
	}

	function open(row: Row) {
		current = row;
		error = '';
		mode = row.splits.length > 1 ? 'split' : 'single';
		parts = row.splits.length
			? row.splits.map((s) => ({ category_id: s.category_id, amount: moneyInput(s.amount_cents) }))
			: [{ category_id: null, amount: moneyInput(row.amount_cents) }];
		remember = row.status === 'open' && !row.withdrawal;
		excluded = !!row.excluded;
		note = row.note ?? '';
		fromPot = !row.splits.some((s) => s.from_pot === 0);
		refundOn = row.refund_expected != null;
		refundAmount = moneyInput(row.refund_expected ?? -row.amount_cents);
		if (!dialog.open) dialog.showModal();
	}

	function pickerFilter(row: Row) {
		// Alles op de spaarrekening hoort bij een spaarpot; inkomsten mogen als er een pot voor is.
		if (row.needsPot) return (o: CatOption) => o.savings || (!!data.incomePot && o.tree === 'inkomsten');
		return () => true;
	}

	function sortedOptions(row: Row): CatOption[] {
		// Bij geld dat binnenkomt staan de inkomsten bovenaan; een terugbetaling kan ook bij een uitgave.
		if (row.amount_cents > 0 && (!row.needsPot || (data.incomePot && row.transfer_account_id == null))) return [...data.options].sort((a, b) => (a.tree === b.tree ? 0 : a.tree === 'inkomsten' ? -1 : 1));
		return data.options;
	}

	async function save(splits: { category_id: number; amount_cents: number }[]) {
		splitsJson = JSON.stringify(splits);
		await tick();
		form.requestSubmit();
	}

	function pickSingle(id: number | null) {
		if (!current || id === null) return;
		save([{ category_id: id, amount_cents: current.amount_cents }]);
	}

	const partsTotal = $derived(parts.reduce((s, p) => s + (parseMoney(p.amount) ?? 0), 0));
	const remaining = $derived(current ? current.amount_cents - partsTotal : 0);

	function saveSplit() {
		const splits = parts
			.filter((p) => p.category_id && parseMoney(p.amount))
			.map((p) => ({ category_id: p.category_id!, amount_cents: parseMoney(p.amount)! }));
		save(splits);
	}

	function startSplit() {
		if (!current) return;
		const first = parts[0]?.category_id ?? null;
		parts = [
			{ category_id: first, amount: moneyInput(current.amount_cents) },
			{ category_id: null, amount: '' }
		];
		mode = 'split';
	}

	const refundChanged = $derived(
		!!current &&
			(refundOn !== (current.refund_expected != null) || (refundOn && Math.abs(parseMoney(refundAmount) ?? 0) !== current.refund_expected))
	);

	// Uitgaven waar deze binnenkomende boeking een teruggave van kan zijn; een passend bedrag eerst.
	const candidates = $derived.by(() => {
		if (!current || current.amount_cents <= 0 || current.needsPot || current.transfer_account_id != null || current.refund_source) return [];
		const amount = current.amount_cents;
		return [...data.refunds]
			.filter((e) => e.booking_date <= current!.booking_date)
			.sort((a, b) => Number(b.expected - b.received === amount) - Number(a.expected - a.received === amount))
			.slice(0, 6);
	});

	/** Koppelen aan een uitgave (of loskoppelen met of = 0), daarna het venster bijwerken. */
	async function linkRefund(of: number) {
		if (!current) return;
		const id = current.id;
		const result = await post('koppel', { id: String(id), of: String(of) });
		if (result.type === 'failure') {
			error = String(result.data?.error ?? 'Koppelen lukte niet.');
			return;
		}
		if (of) {
			message = 'Gekoppeld als teruggave. Hij staat nu in hetzelfde budget als de uitgave.';
			dialog.close();
		} else refresh(id);
	}

	async function closeRefund() {
		if (!current) return;
		const id = current.id;
		await post('afsluiten', { id: String(id) });
		refresh(id);
	}

	function refresh(id: number) {
		const fresh = data.rows.find((r) => r.id === id);
		if (!fresh) return dialog.close();
		queue = queue.map((r) => (r.id === id ? fresh : r));
		open(fresh);
	}

	function chipFor(row: Row): { text: string; kind: string } {
		if (row.status === 'uitgesloten') return { text: 'Telt niet mee', kind: '' };
		if (row.status === 'overboeking') return { text: 'Overboeking', kind: '' };
		if (row.status === 'open') return { text: row.needsPot ? 'Kies een budget' : 'Indelen', kind: 'warn' };
		if (row.splits.length > 1) return { text: `${row.splits.length} delen`, kind: 'accent' };
		return { text: labels.get(row.splits[0].category_id) ?? '?', kind: 'accent' };
	}

	// Bij een overboeking tussen eigen rekeningen is de tegenpartij jullie eigen naam; de omschrijving zegt meer.
	function title(row: Row) {
		if (row.transfer_account_id != null) return row.description || 'Overboeking';
		return row.counterparty || row.description || 'Onbekend';
	}

	function subtitle(row: Row) {
		if (row.transfer_account_id != null) {
			const other = accountName.get(row.transfer_account_id) ?? 'eigen rekening';
			return `${row.amount_cents < 0 ? 'Naar' : 'Van'} ${other}`;
		}
		return row.counterparty ? row.description : '';
	}
</script>

<svelte:head><title>Boekingen · Stax</title></svelte:head>

<div class="stack">
	<header class="top">
		<h1>Boekingen</h1>
		<div class="seg viewtoggle" role="group" aria-label="Weergave">
			<button type="button" aria-pressed={view === 'lijst'} onclick={() => setView('lijst')}>Lijst</button>
			<button type="button" aria-pressed={view === 'tabel'} onclick={() => setView('tabel')}>Tabel</button>
		</div>
		<a class="btn" href="/upload"><Icon name="upload" size={18} /> Upload</a>
	</header>

	<div class="toolbar">
		<div class="seg" role="group" aria-label="Welke boekingen">
			<button type="button" aria-pressed={data.filters.status !== 'open' && data.filters.status !== 'terug'} onclick={() => setFilter('status', null)}>Alles</button>
			<button type="button" aria-pressed={data.filters.status === 'open'} onclick={() => setFilter('status', 'open')}>
				Nog indelen {#if data.openCount}<b>{data.openCount}</b>{/if}
			</button>
			{#if data.refunds.length || data.filters.status === 'terug'}
				<button type="button" aria-pressed={data.filters.status === 'terug'} onclick={() => setFilter('status', 'terug')}>
					Terug verwacht {#if data.refunds.length}<b>{data.refunds.length}</b>{/if}
				</button>
			{/if}
		</div>
		{#if view === 'tabel'}
			<label class="check small learn"><input type="checkbox" bind:checked={learn} /> Vergelijkbare boekingen meteen mee indelen</label>
		{/if}
	</div>

	<div class="filters">
		<label class="searchbox">
			<Icon name="search" size={18} />
			<span class="sr-only">Zoeken</span>
			<input type="search" placeholder="Zoek op naam, omschrijving of bedrag" bind:value={search} oninput={onSearch} />
		</label>
		<select aria-label="Maand" value={data.filters.month ?? 'alle'} onchange={(e) => setFilter('maand', e.currentTarget.value)}>
			<option value="alle">Alle maanden</option>
			{#each data.months as m}<option value={m}>{monthName(m)}</option>{/each}
		</select>
		<select aria-label="Rekening" value={data.filters.account ?? ''} onchange={(e) => setFilter('rekening', e.currentTarget.value)}>
			<option value="">Alle rekeningen</option>
			{#each data.accounts as a}<option value={a.id}>{a.name}</option>{/each}
		</select>
		{#if data.filters.cat || data.filters.van}
			<div class="filterchips">
				{#if data.filters.van}
					<button type="button" class="chip accent filterchip" onclick={() => setFilter('van', null)}>
						Van: {data.filters.van} <Icon name="x" size={14} />
					</button>
				{/if}
				{#if data.filters.cat}
					<button type="button" class="chip accent filterchip" onclick={() => setFilter('map', null)}>
						Budget: {labels.get(data.filters.cat)} <Icon name="x" size={14} />
					</button>
				{/if}
			</div>
		{/if}
	</div>

	{#if message}
		<p class="banner ok" role="status">{message}</p>
	{/if}

	{#if groups.length === 0}
		<div class="card empty">
			{#if data.filters.status === 'open'}Alles is ingedeeld. Mooi zo.{:else if data.filters.status === 'terug'}Je verwacht nergens meer geld voor terug.{:else}Geen boekingen gevonden.{/if}
		</div>
	{/if}

	{#if view === 'tabel' && data.rows.length}
		<div class="card tablewrap">
			<table class="tx">
				<thead>
					<tr>
						<th class="cb"><input type="checkbox" aria-label="Alles selecteren" checked={allSelected} onchange={toggleAll} /></th>
						<th>Datum</th>
						<th>Tegenpartij</th>
						<th>Omschrijving</th>
						<th>Rekening</th>
						<th>Budget</th>
						<th class="r">Bedrag</th>
						<th><span class="sr-only">Details</span></th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row (row.id)}
						<tr class:sel={selected.has(row.id)} class:dim={row.status === 'overboeking' || row.status === 'uitgesloten'}>
							<td class="cb"><input type="checkbox" aria-label="Selecteer {title(row)}" checked={selected.has(row.id)} onchange={() => toggle(row.id)} /></td>
							<td class="date num">{shortDate(row.booking_date)}</td>
							<td class="party">
								{#if row.transfer_account_id != null}
									<span class="muted">{row.amount_cents < 0 ? 'Naar' : 'Van'} {accountName.get(row.transfer_account_id)}</span>
								{:else if row.counterparty}
									<button type="button" class="plain partybtn" title="Alleen boekingen van {row.counterparty}" onclick={() => setFilter('van', row.counterparty)}>
										{row.counterparty}
									</button>
								{:else}<span class="muted">–</span>{/if}
							</td>
							<td class="desc" title={row.raw_info}>{row.description || '–'}</td>
							<td class="muted small">{accountName.get(row.account_id)}</td>
							<td class="cat">
								{#if row.status === 'overboeking'}
									<span class="chip">Overboeking</span>
								{:else if row.status === 'uitgesloten'}
									<button type="button" class="plain chip" onclick={() => openFromList(row)}>Telt niet mee</button>
								{:else if row.splits.length > 1}
									<button type="button" class="plain chip accent" onclick={() => openFromList(row)}>{row.splits.length} delen</button>
								{:else}
									<CategoryCombo
										variant="inline"
										label="Budget voor {title(row)}"
										options={sortedOptions(row)}
										filter={pickerFilter(row)}
										value={row.splits[0]?.category_id ?? null}
										placeholder={busyId === row.id ? 'Opslaan…' : row.needsPot ? 'Kies een budget' : 'Indelen'}
										attention={row.status === 'open'}
										disabled={busyId === row.id}
										allowEmpty={row.status !== 'open'}
										onchange={(id) => quick(row, id)}
									/>
								{/if}
								{#if outsidePot(row)}<span class="outside small" title="Telt mee als uitgegeven; het saldo blijft staan">van lopende rekening</span>{/if}
								{#if refundLeft(row)}<span class="outside small">{money(refundLeft(row))} terug verwacht</span>{/if}
								{#if row.refund_source}<span class="outside small">teruggave van {row.refund_source.name}</span>{/if}
							</td>
							<td class="r num amount" class:pos={row.amount_cents > 0}>{money(row.amount_cents)}</td>
							<td class="more">
								<button type="button" class="icon ghost" aria-label="Splitsen" title="Splitsen" onclick={() => openFromList(row, true)}>
									<Icon name="split" size={17} />
								</button>
								<button type="button" class="icon ghost" aria-label="Details en notitie" title="Details en notitie" onclick={() => openFromList(row)}>
									<Icon name="dots" size={17} />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

	{#if selected.size}
		<div class="bulkbar" role="region" aria-label="Geselecteerde boekingen">
			<strong>{selected.size} geselecteerd</strong>
			<div class="bulkpick">
				<CategoryCombo
					label="Budget voor selectie"
					placeholder="Indelen als…"
					options={data.options}
					value={bulkCat ? Number(bulkCat) : null}
					onchange={(id) => (bulkCat = id ? String(id) : '')}
				/>
			</div>
			<button type="button" class="primary" disabled={!bulkCat} onclick={() => bulk({ category_id: bulkCat })}>Toepassen</button>
			<button type="button" onclick={() => bulk({ excluded: '1' })}>Niet meetellen</button>
			<button type="button" onclick={() => bulk({ uit_pot: '0' })} title="Telt mee als uitgegeven, maar het saldo blijft staan">Niet van het saldo</button>
			<button type="button" onclick={() => bulk({ uit_pot: '1' })}>Wel van het saldo</button>
			<button type="button" class="ghost" onclick={() => (selected = new Set())}>Wissen</button>
		</div>
	{/if}

	{#each view === 'lijst' ? groups : [] as g (g.date)}
		<section>
			<h2 class="day muted small">{dayLabel(g.date)}</h2>
			<ul class="card list">
				{#each g.rows as row (row.id)}
					{@const chip = chipFor(row)}
					<li>
						<button type="button" class="row" class:dim={row.status === 'overboeking' || row.status === 'uitgesloten'} onclick={() => openFromList(row)}>
							<span class="main">
								<span class="who">{title(row)}</span>
								<span class="what muted small">
									{#if row.account_kind === 'spaar'}{accountName.get(row.account_id)}{#if subtitle(row)}{' · '}{/if}{/if}{subtitle(row)}
								</span>
								{#if refundLeft(row)}<span class="refund small">{money(refundLeft(row))} terug verwacht</span>{/if}
								{#if row.refund_source}<span class="refund small">Teruggave van {row.refund_source.name}</span>{/if}
							</span>
							<span class="side">
								<span class="num amount" class:pos={row.amount_cents > 0}>{money(row.amount_cents)}</span>
								<span class="chip {chip.kind}">{chip.text}</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>

<svelte:window onkeydown={onKey} />

<dialog bind:this={dialog} onclose={() => (current = null)} aria-labelledby="dlg-title">
	{#if current}
		<form
			bind:this={form}
			method="POST"
			action="?/indelen"
			use:enhance={() => {
				const wasOpenList = data.filters.status === 'open';
				return async ({ result, update }) => {
					if (result.type === 'failure') {
						error = String(result.data?.error ?? 'Opslaan lukte niet.');
						return;
					}
					await update({ reset: false });
					if (result.type !== 'success') return;
					const applied = Number(result.data?.applied ?? 0);
					message = applied > 0 ? `Opgeslagen. Ook ${applied} andere ${applied === 1 ? 'boeking' : 'boekingen'} automatisch ingedeeld.` : '';
					const fresh = new Map(((result.data?.rows ?? []) as Row[]).map((r) => [r.id, r]));
					queue = queue.map((r) => fresh.get(r.id) ?? r);
					// In de lijst 'nog indelen' gaan we meteen door naar de volgende die nog open staat.
					const next = wasOpenList ? queue.findIndex((r, i) => i > pos && r.status === 'open') : -1;
					if (next >= 0) {
						pos = next;
						open(queue[next]);
					} else dialog.close();
				};
			}}
		>
			<input type="hidden" name="id" value={current.id} />
			<input type="hidden" name="splits" value={splitsJson} />
			<input type="hidden" name="queue" value={queue.map((r) => r.id).join(',')} />
			<input type="hidden" name="uit_pot" value={fromPot ? '1' : '0'} />

			<header class="dlg-head">
				<div>
					<h2 id="dlg-title">{title(current)}</h2>
					<p class="muted small">{shortDate(current.booking_date)} · {accountName.get(current.account_id)}</p>
				</div>
				<div class="nav">
					<button type="button" class="ghost icon" aria-label="Vorige boeking" disabled={pos <= 0} onclick={() => go(-1)}><Icon name="left" /></button>
					<span class="muted small num">{pos + 1}/{queue.length}</span>
					<button type="button" class="ghost icon" aria-label="Volgende boeking (overslaan)" disabled={pos >= queue.length - 1} onclick={() => go(1)}>
						<Icon name="right" />
					</button>
					<button type="button" class="ghost icon" aria-label="Sluiten" onclick={() => dialog.close()}><Icon name="x" /></button>
				</div>
			</header>

			<p class="big num" class:pos={current.amount_cents > 0}>{money(current.amount_cents)}</p>
			{#if current.raw_info}<p class="raw muted small">{current.raw_info}</p>{/if}
			{#if current.counterparty && current.transfer_account_id == null && data.filters.van !== current.counterparty}
				<button
					type="button"
					class="plain link small allfrom"
					onclick={() => {
						const name = current!.counterparty;
						dialog.close();
						setFilter('van', name);
					}}>Alle boekingen van {current.counterparty} →</button
				>
			{/if}

			{#if current.status === 'overboeking'}
				<p class="hint">
					Dit is een overboeking tussen jullie eigen rekeningen. Die hoeft niet ingedeeld te worden: de inleg wordt aan de kant van de
					spaarrekening aan een budget gekoppeld.
				</p>
			{:else}
				{#if current.withdrawal}
					<p class="hint">Geld van de spaarrekening naar de betaalrekening. Van welk budget komt het? Het saldo daarvan gaat met dit bedrag omlaag.</p>
					{#if data.toWithdraw.length && !current.splits.length}
						<div class="refundpick">
							<p class="small muted">Hier moet nog geld voor van de spaarrekening komen:</p>
							<ul>
								{#each [...data.toWithdraw].sort((a, b) => Number(b.cents === -current!.amount_cents) - Number(a.cents === -current!.amount_cents)) as p (p.id)}
									<li>
										<button type="button" class="plain" onclick={() => pickSingle(p.id)}>
											<span class="main"><span>{p.name}</span></span>
											<span class="num small" class:exact={p.cents === -current.amount_cents}>nog {money(p.cents)}</span>
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				{:else if current.needsPot}
					<p class="hint">
						{#if current.transfer_account_id != null}
							Geld naar de spaarrekening. Bij welk budget hoort het?
						{:else if data.incomePot && current.amount_cents > 0}
							Geld dat direct op de spaarrekening binnenkomt, zoals rente. Zet je het bij inkomsten, dan komt het in {data.incomePot}.
						{:else}
							Een boeking op de spaarrekening. Bij welk budget hoort het?
						{/if}
					</p>
				{/if}

				{#if current.refund_source}
					<div class="hint refundbox">
						<span>
							Teruggave van <strong>{current.refund_source.name}</strong>
							<span class="muted">· {shortDate(current.refund_source.date)} · {money(current.refund_source.amount)}</span>
						</span>
						<button type="button" class="ghost small" onclick={() => linkRefund(0)}>Ontkoppelen</button>
					</div>
				{:else if candidates.length}
					<div class="refundpick">
						<p class="small muted">Is dit geld terug voor een uitgave?</p>
						<ul>
							{#each candidates as e (e.id)}
								<li>
									<button type="button" class="plain" onclick={() => linkRefund(e.id)}>
										<span class="main">
											<span>{e.name}</span>
											<span class="muted small">{shortDate(e.booking_date)}{#if e.note}{` · ${e.note}`}{/if}</span>
										</span>
										<span class="num small" class:exact={e.expected - e.received === current.amount_cents}>
											nog {money(e.expected - e.received)}
										</span>
									</button>
								</li>
							{/each}
						</ul>
					</div>
				{/if}

				{#if mode === 'single'}
					<CategoryPicker
						options={sortedOptions(current)}
						filter={pickerFilter(current)}
						selected={current.splits.length === 1 ? current.splits[0].category_id : null}
						onpick={pickSingle}
					/>
				{:else}
					<div class="parts">
						{#each parts as p, i}
							<div class="part">
								<CategoryCombo
									label="Budget voor deel {i + 1}"
									options={sortedOptions(current)}
									filter={pickerFilter(current)}
									value={p.category_id}
									onchange={(id) => (p.category_id = id)}
								/>
								<input aria-label="Bedrag deel {i + 1}" inputmode="decimal" bind:value={p.amount} placeholder="0,00" />
								<button type="button" class="ghost icon" aria-label="Deel verwijderen" disabled={parts.length < 2} onclick={() => parts.splice(i, 1)}>
									<Icon name="x" size={18} />
								</button>
							</div>
						{/each}
						<div class="parts-foot">
							<button type="button" onclick={() => parts.push({ category_id: null, amount: remaining ? moneyInput(remaining) : '' })}>
								<Icon name="plus" size={18} /> Deel toevoegen
							</button>
							<span class="small num" class:neg={remaining !== 0}>
								{remaining === 0 ? 'Klopt precies' : `Nog ${money(remaining)} te verdelen`}
							</span>
						</div>
					</div>
				{/if}

				<div class="options">
					{#if mode === 'single' && !current.withdrawal}
						<label class="check small">
							<input type="checkbox" name="remember" bind:checked={remember} />
							<span>
								{#if current.needsPot || !current.counterparty}
									Omschrijving “{current.description || '—'}” voortaan zo indelen
								{:else}
									{current.counterparty} voortaan zo indelen
								{/if}
							</span>
						</label>
					{/if}
					{#if onPot(current)}
						<label class="check small">
							<input type="checkbox" bind:checked={fromPot} />
							<span>
								Van het saldo afhalen
								<span class="muted">
									{fromPot
										? '— dit geld moet nog van de spaarrekening komen. Het saldo gaat omlaag zodra je die opname aan het budget koppelt.'
										: '— telt mee als uitgegeven, maar de lopende rekening betaalt het en het saldo blijft staan.'}
								</span>
							</span>
						</label>
					{/if}
					{#if current.amount_cents < 0 && current.transfer_account_id == null}
						<div class="refundopt">
							<label class="check small">
								<input type="checkbox" name="terug" bind:checked={refundOn} />
								<span>Ik krijg hier geld voor terug <span class="muted">— bijvoorbeeld iets wat je hebt voorgeschoten</span></span>
							</label>
							{#if refundOn}
								<div class="refundrow">
									<input name="terug_bedrag" aria-label="Bedrag dat je terugverwacht" inputmode="decimal" bind:value={refundAmount} placeholder="0,00" />
									{#if current.refund_received}
										<span class="small muted">{money(current.refund_received)} al binnen</span>
										<button type="button" class="ghost small" onclick={closeRefund} title="Er komt niets meer bij">Klaar, niet meer verwachten</button>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
					<label class="check small">
						<input type="checkbox" name="excluded" bind:checked={excluded} />
						<span>Niet meetellen (bijvoorbeeld een testoverboeking)</span>
					</label>
					<label class="field">
						Notitie
						<input name="note" bind:value={note} placeholder="Optioneel" />
					</label>
				</div>
			{/if}

			{#if error}<p class="neg small">{error}</p>{/if}

			<footer>
				{#if current.status !== 'overboeking'}
					{#if mode === 'single'}
						<button type="button" class="ghost" onclick={startSplit}><Icon name="split" size={18} /> Splitsen</button>
						{#if current.splits.length || excluded !== !!current.excluded || note !== (current.note ?? '') || fromPot === outsidePot(current) || refundChanged}
							<button
								type="button"
								onclick={() => save(current!.splits.map((s) => ({ category_id: s.category_id, amount_cents: s.amount_cents })))}
							>
								Opslaan
							</button>
						{/if}
						{#if current.splits.length}
							<button type="button" class="ghost danger" onclick={() => save([])}>Indeling wissen</button>
						{/if}
					{:else}
						<button type="button" class="ghost" onclick={() => (mode = 'single')}>Niet splitsen</button>
						<button type="button" class="primary" disabled={remaining !== 0} onclick={saveSplit}>Opslaan</button>
					{/if}
				{/if}
			</footer>
		</form>
	{/if}
</dialog>

<style>
	.top {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.top h1 {
		flex: 1;
	}
	.viewtoggle {
		display: none;
	}
	@media (min-width: 860px) {
		.viewtoggle {
			display: inline-flex;
		}
	}
	@media (max-width: 600px) {
		.top > .btn {
			display: none;
		}
	}
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-top: -12px;
	}
	.learn {
		color: var(--muted);
	}
	.tablewrap {
		overflow-x: auto;
	}
	.tx {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}
	.tx th {
		position: sticky;
		top: 0;
		background: var(--surface);
		text-align: left;
		font-weight: 500;
		font-size: 12.5px;
		color: var(--muted);
		padding: 12px 10px;
		border-bottom: 0.5px solid var(--line);
		white-space: nowrap;
	}
	.tx td {
		padding: 8px 10px;
		border-bottom: 0.5px solid var(--line);
		vertical-align: middle;
	}
	.tx tbody tr {
		transition: background-color 0.12s;
	}
	.tx tbody tr:hover {
		background: var(--surface-2);
	}
	.tx tr.sel {
		background: var(--accent-soft);
	}
	.tx tr.dim .partybtn,
	.tx tr.dim .amount {
		color: var(--muted);
	}
	.tx tbody tr:last-child td {
		border-bottom: 0;
	}
	.tx .cb {
		width: 44px;
		padding-left: 16px;
	}
	.tx .r {
		text-align: right;
	}
	.tx .date {
		white-space: nowrap;
		color: var(--muted);
	}
	.tx .party {
		max-width: 220px;
	}
	.partybtn {
		display: block;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		font-weight: 560;
		border-radius: 6px;
		transition: color 0.15s;
	}
	.partybtn:hover {
		color: var(--accent);
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--accent) 40%, transparent);
		text-underline-offset: 3px;
	}
	/* De omschrijving vult de ruimte die overblijft en wordt afgekapt, zodat bedrag en knoppen altijd passen. */
	.tx .desc {
		width: 100%;
		max-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--muted);
	}
	.tx .cat {
		width: 280px;
	}
	.tx .more {
		width: 92px;
		padding-right: 12px;
		white-space: nowrap;
	}
	.outside {
		display: block;
		margin: 2px 0 0 10px;
		color: var(--muted);
	}
	.catbtn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		max-width: 270px;
		padding: 5px 10px;
		border-radius: 8px;
		color: var(--accent);
		font-weight: 550;
		font-size: 13.5px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: background-color 0.15s;
	}
	.catbtn:hover {
		background: var(--accent-soft);
	}
	.catbtn.open {
		background: var(--warn-soft);
		color: var(--warn);
	}
	.catbtn :global(svg) {
		flex-shrink: 0;
		opacity: 0.6;
	}
	.catsel {
		min-height: 34px;
		padding: 4px 8px;
		font-size: 13.5px;
	}
	.bulkbar {
		position: sticky;
		bottom: 20px;
		z-index: 15;
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		padding: 10px 12px 10px 18px;
		border-radius: 18px;
		background: var(--surface);
		box-shadow: var(--float);
	}
	.bulkpick {
		flex: 1;
		min-width: 260px;
	}
	.seg b {
		font-size: 12px;
		color: var(--warn);
	}
	.filters {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 8px;
	}
	.searchbox {
		grid-column: 1 / -1;
		position: relative;
		color: var(--muted);
	}
	.searchbox :global(svg) {
		position: absolute;
		left: 11px;
		top: 11px;
	}
	.searchbox input {
		padding-left: 36px;
	}
	.filterchips {
		grid-column: 1 / -1;
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}
	.filterchip {
		border: 0;
		min-height: 28px;
		cursor: pointer;
	}
	@media (min-width: 700px) {
		.filters {
			grid-template-columns: minmax(0, 1fr) 180px 180px;
		}
		.searchbox {
			grid-column: auto;
		}
	}
	.banner.ok {
		background: var(--accent-soft);
	}
	.day {
		font-weight: 550;
		margin: 6px 4px 6px;
		text-transform: capitalize;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow: hidden;
	}
	.list li + li {
		border-top: 1px solid var(--line);
	}
	.row {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 60px;
		padding: 10px 14px;
		border: 0;
		border-radius: 0;
		background: transparent;
		font-weight: 400;
		text-align: left;
		white-space: normal;
	}
	.row.dim .who,
	.row.dim .amount {
		color: var(--muted);
	}
	.main {
		display: flex;
		flex-direction: column;
		min-width: 0;
		gap: 1px;
	}
	.who {
		font-weight: 560;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.what {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
		.side {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
		flex-shrink: 0;
		max-width: 50%;
	}
	.amount {
		font-weight: 560;
	}

	dialog {
		width: min(560px, 100vw);
		max-height: min(92dvh, 860px);
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 16px;
		background: var(--surface);
		color: var(--text);
		box-shadow: 0 20px 60px rgb(0 0 0 / 0.25);
	}
	dialog:focus {
		outline: none;
	}
	dialog::backdrop {
		background: rgb(20 20 18 / 0.45);
	}
	@media (max-width: 600px) {
		dialog {
			margin: auto 0 0;
			max-width: 100vw;
			border-radius: 18px 18px 0 0;
			padding-bottom: env(safe-area-inset-bottom);
		}
	}
	dialog form {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px;
	}
	.dlg-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}
	.nav {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}
	.nav span {
		min-width: 44px;
		text-align: center;
	}
	.dlg-head p {
		margin: 3px 0 0;
	}
	.big {
		margin: 0;
		font-size: 28px;
		font-weight: 650;
		letter-spacing: -0.02em;
	}
	.raw {
		margin: -6px 0 0;
		word-break: break-word;
	}
	.allfrom {
		align-self: flex-start;
		margin-top: -6px;
	}
	.hint {
		margin: 0;
		padding: 10px 12px;
		border-radius: 10px;
		background: var(--surface-2);
		font-size: 14px;
	}
	.parts {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.part {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 110px 40px;
		gap: 6px;
	}
	.parts-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.options {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	/* Teruggaven */
	.refund {
		color: var(--accent);
		font-weight: 560;
	}
	.refundbox {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}
	.refundpick p {
		margin: 0 0 6px;
	}
	.refundpick ul {
		margin: 0;
		padding: 0;
		list-style: none;
		border-radius: 12px;
		background: var(--surface-2);
	}
	.refundpick li + li {
		border-top: 0.5px solid var(--line);
	}
	.refundpick button {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 9px 12px;
		border-radius: 12px;
		text-align: left;
		font-weight: 400;
	}
	.refundpick button:hover {
		background: var(--fill);
	}
	.refundpick .exact {
		color: var(--accent);
		font-weight: 600;
	}
	.refundrow {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
		margin: 8px 0 0 30px;
	}
	.refundrow input {
		width: 130px;
	}
	footer {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		justify-content: flex-end;
	}
	footer:empty {
		display: none;
	}
</style>
