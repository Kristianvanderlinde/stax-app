<script lang="ts">
	import { enhance, deserialize } from '$app/forms';
	import { money } from '$lib/format';

	type Needs = { headers: string[]; sample: string[][]; delimiter: string; mapping: Record<string, number | string | undefined>; needsIban: boolean };
	type Example = { date: string; amountCents: number; counterparty: string | null; description: string };
	let { filename, content, needs }: { filename: string; content: string; needs: Needs } = $props();

	const MAIN: [string, string][] = [
		['date', 'Datum'],
		['amount', 'Bedrag'],
		['counterparty', 'Naam tegenpartij'],
		['description', 'Omschrijving']
	];
	const MORE: [string, string][] = [
		['direction', 'Af of bij (als het bedrag geen min heeft)'],
		['debit', 'Bedrag af (aparte kolom)'],
		['credit', 'Bedrag bij (aparte kolom)'],
		['counterpartyIban', 'IBAN tegenpartij'],
		['iban', 'Eigen rekening (IBAN)'],
		['balance', 'Saldo na boeking'],
		['ref', 'Volgnummer of referentie']
	];

	// Per betekenis het gekozen kolomnummer ('' = geen), vooraf ingevuld met wat is herkend.
	let cols = $state<Record<string, string>>({});
	$effect.pre(() => {
		const c: Record<string, string> = {};
		for (const [role, col] of Object.entries(needs.mapping)) if (typeof col === 'number') c[role] = String(col);
		cols = c;
	});
	let iban = $state('');
	let example = $state<{ total: number; examples: Example[]; error?: string } | null>(null);
	let busy = $state(false);

	const label = (i: number) => {
		const sample = needs.sample.map((r) => r[i] ?? '').find((v) => v);
		return `${needs.headers[i] || `Kolom ${i + 1}`}${sample ? ` · ${sample}` : ''}`;
	};
	const hasIban = $derived(!!cols.iban);

	function set(role: string, value: string) {
		// Eén kolom heeft één betekenis.
		const next = { ...cols };
		if (value) for (const [r, v] of Object.entries(next)) if (v === value) delete next[r];
		if (value) next[role] = value;
		else delete next[role];
		cols = next;
		refresh();
	}

	function body() {
		const f = new FormData();
		f.set('content', content);
		f.set('delimiter', needs.delimiter);
		f.set('iban', hasIban ? '' : iban);
		for (const [role, col] of Object.entries(cols)) if (col !== '') f.set(`col_${col}`, role);
		return f;
	}

	let timer: ReturnType<typeof setTimeout>;
	function refresh() {
		clearTimeout(timer);
		timer = setTimeout(async () => {
			busy = true;
			try {
				const res = await fetch('?/voorbeeld', { method: 'POST', body: body(), headers: { 'x-sveltekit-action': 'true' } });
				const r = deserialize(await res.text());
				if (r.type === 'success' && r.data) example = r.data as typeof example;
			} finally {
				busy = false;
			}
		}, 150);
	}
	$effect(() => {
		void content;
		refresh();
	});

	const ready = $derived(!!example && example.total > 0 && !example.error);
	const dateText = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
</script>

<section class="card map">
	<h2>Zo lezen we {filename}</h2>

	<div class="preview" class:busy>
		{#if example?.examples.length}
			{#each example.examples as e}
				<div class="row">
					<span class="d muted small">{dateText(e.date)}</span>
					<span class="t"><strong>{e.counterparty || e.description || '—'}</strong>{#if e.counterparty && e.description}<span class="muted small"> {e.description}</span>{/if}</span>
					<span class="num" class:neg={e.amountCents < 0}>{money(e.amountCents)}</span>
				</div>
			{/each}
			<p class="muted small">{example.total} boekingen in totaal. Klopt dit niet? Pas de kolommen hieronder aan.</p>
		{:else if example?.error}
			<p class="neg small">{example.error}</p>
		{:else}
			<p class="muted small">Even kijken…</p>
		{/if}
	</div>

	<form method="POST" action="?/inlezen" use:enhance>
		<input type="hidden" name="name" value={filename} />
		<input type="hidden" name="content" value={content} />
		<input type="hidden" name="delimiter" value={needs.delimiter} />
		{#each Object.entries(cols) as [role, col]}{#if col !== ''}<input type="hidden" name={`col_${col}`} value={role} />{/if}{/each}

		{#if !hasIban}
			<label class="iban">
				<span>Van welke rekening is dit bestand? <span class="muted">(IBAN; staat niet in het bestand)</span></span>
				<input name="iban" bind:value={iban} oninput={refresh} placeholder="NL00 BANK 0123 4567 89" autocomplete="off" />
			</label>
		{/if}

		<details>
			<summary>Kolommen aanpassen</summary>
			<div class="fields">
				{#each MAIN as [role, name]}
					<label>
						<span>{name}</span>
						<select value={cols[role] ?? ''} onchange={(e) => set(role, e.currentTarget.value)}>
							<option value="">Geen</option>
							{#each needs.headers as _, i}<option value={String(i)}>{label(i)}</option>{/each}
						</select>
					</label>
				{/each}
			</div>
			<details class="more">
				<summary>Meer opties</summary>
				<div class="fields">
					{#each MORE as [role, name]}
						<label>
							<span>{name}</span>
							<select value={cols[role] ?? ''} onchange={(e) => set(role, e.currentTarget.value)}>
								<option value="">Geen</option>
								{#each needs.headers as _, i}<option value={String(i)}>{label(i)}</option>{/each}
							</select>
						</label>
					{/each}
				</div>
			</details>
		</details>

		<button class="btn primary" type="submit" disabled={!ready || (!hasIban && iban.replace(/\s/g, '').length < 12)}>Inlezen</button>
	</form>
</section>

<style>
	.map {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.map h2 {
		margin: 0;
	}
	.preview {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 4px 12px;
		transition: opacity 0.15s;
	}
	.preview.busy {
		opacity: 0.5;
	}
	.preview p {
		margin: 8px 0;
	}
	.row {
		display: grid;
		grid-template-columns: 7.5em 1fr auto;
		gap: 12px;
		align-items: baseline;
		padding: 8px 0;
		border-bottom: 1px solid var(--line);
	}
	.t {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
		align-items: flex-start;
		max-width: 100%;
	}
	summary {
		cursor: pointer;
		color: var(--muted);
		font-size: 0.9rem;
	}
	.more {
		margin-top: 10px;
	}
	.fields {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 10px 14px;
		margin-top: 10px;
	}
	.fields label,
	.iban {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 0.85rem;
	}
</style>
