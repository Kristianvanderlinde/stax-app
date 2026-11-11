<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { enhance } from '$app/forms';
	import CategoryCombo from '$lib/components/CategoryCombo.svelte';

	let { data, form } = $props();
	const FIELDS: Record<string, string> = { tegenpartij: 'Tegenpartij', omschrijving: 'Omschrijving', iban: 'Rekeningnummer', mcc: 'Winkelsoort (MCC)' };
	let showMcc = $state(false);
	let newCat = $state<number | null>(null);
	const visibleRules = $derived(data.rules.filter((r) => showMcc || r.field !== 'mcc'));
	const options = $derived(data.options.filter((o) => o.depth > 0));

	// Een ander budget kiezen slaat de regel meteen op.
	function change(e: HTMLFormElement | null, id: number | null) {
		if (!e || id == null) return;
		(e.elements.namedItem('category_id') as HTMLInputElement).value = String(id);
		e.requestSubmit();
	}
	let forms = $state<Record<number, HTMLFormElement>>({});
</script>

<svelte:head><title>Regels · Stax</title></svelte:head>

<div class="stack">
	<header>
		<a class="link back" href="/instellingen"><Icon name="left" size={18} /> Instellingen</a>
		<h1>Regels</h1>
		<p class="muted">
			Regels delen nieuwe boekingen automatisch in. Ze ontstaan vanzelf als je bij het indelen “voortaan zo indelen” aanvinkt. Een regel op
			tegenpartij gaat vóór een regel op winkelsoort.
		</p>
	</header>
	{#if form?.error}<p class="banner">{form.error}</p>{/if}

	<form method="POST" action="?/nieuw" class="card newrule" use:enhance={() => async ({ update }) => { await update(); newCat = null; }}>
		<h2>Regel toevoegen</h2>
		<div class="nr-fields">
			<select name="field" aria-label="Veld">
				{#each Object.entries(FIELDS) as [v, l]}<option value={v}>{l}</option>{/each}
			</select>
			<select name="op" aria-label="Vergelijking">
				<option value="bevat">bevat</option>
				<option value="is">is precies</option>
			</select>
			<input name="pattern" placeholder="bijv. Albert Heijn" aria-label="Tekst" />
			<input type="hidden" name="category_id" value={newCat ?? ''} />
			<CategoryCombo label="Budget" placeholder="Kies een budget…" {options} value={newCat} onchange={(id) => (newCat = id)} />
			<button class="primary">Toevoegen</button>
		</div>
		{#if form && 'applied' in form}<p class="small muted">{form.applied} boekingen ingedeeld.</p>{/if}
	</form>

	<section>
		<div class="section-head">
			<h2>{visibleRules.length} regels</h2>
			<label class="check small"><input type="checkbox" bind:checked={showMcc} /> Ook winkelsoorten tonen</label>
		</div>
		<ul class="card list">
			{#each visibleRules as r (r.id)}
				<li>
					<form bind:this={forms[r.id]} method="POST" action="?/regel" class="rule" use:enhance={() => async ({ update }) => update({ reset: false })}>
						<input type="hidden" name="id" value={r.id} />
						<input type="hidden" name="category_id" value={r.category_id} />
						<span class="what">
							<span class="muted small">{FIELDS[r.field]} {r.op}</span>
							<strong>{r.pattern}</strong>
						</span>
						<CategoryCombo label="Budget" variant="inline" {options} value={r.category_id} onchange={(id) => change(forms[r.id], id)} />
						<button class="ghost danger" name="delete" value="1">Verwijderen</button>
					</form>
				</li>
			{:else}
				<li class="empty small">Nog geen eigen regels.</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	header p {
		margin: 6px 0 0;
		max-width: 66ch;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.list li + li {
		border-top: 0.5px solid var(--line);
	}
	.empty {
		padding: 18px;
	}
	.rule {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
		padding: 10px 16px;
		align-items: center;
	}
	@media (min-width: 700px) {
		.rule {
			grid-template-columns: 1fr minmax(0, 280px) auto;
		}
	}
	.what {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.what strong {
		font-weight: 560;
		overflow-wrap: anywhere;
	}
	.newrule {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 18px;
	}
	.newrule h2,
	.newrule p {
		margin: 0;
	}
	.nr-fields {
		display: grid;
		gap: 8px;
	}
	@media (min-width: 800px) {
		.nr-fields {
			grid-template-columns: 170px 120px 1fr 1fr auto;
			align-items: center;
		}
	}
</style>
