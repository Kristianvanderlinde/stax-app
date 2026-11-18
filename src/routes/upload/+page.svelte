<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import CsvMap from './CsvMap.svelte';

	let { data, form } = $props();
	let input: HTMLInputElement;
	let dragging = $state(false);
	let busy = $state(false);
	let chosen = $state<string[]>([]);


	function drop(e: DragEvent) {
		e.preventDefault();
		dragging = false;
		if (!e.dataTransfer?.files.length) return;
		input.files = e.dataTransfer.files;
		input.form?.requestSubmit();
	}
</script>

<svelte:head><title>Upload · Stax</title></svelte:head>

<div class="stack">
	<header>
		<h1>Upload</h1>
		<p class="muted">Exporteer in de app of op de website van je bank de transacties als XML (camt.053) of CSV en zet ze hier neer. Meerdere rekeningen tegelijk mag. Boekingen die er al zijn, worden overgeslagen.</p>
	</header>

	<form
		method="POST"
		action="?/inlezen"
		enctype="multipart/form-data"
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update();
				busy = false;
				chosen = [];
			};
		}}
	>
		<label
			class="drop card"
			class:dragging
			ondragover={(e) => {
				e.preventDefault();
				dragging = true;
			}}
			ondragleave={() => (dragging = false)}
			ondrop={drop}
		>
			<span class="drop-icon"><Icon name="upload" size={32} /></span>
			<strong>{busy ? 'Bezig met inlezen…' : 'Sleep bankbestanden hierheen'}</strong>
			<span class="muted small">of tik om bestanden te kiezen</span>
			<input
				bind:this={input}
				class="sr-only"
				type="file"
				name="files"
				accept=".xml,.csv,application/xml,text/xml,text/csv"
				multiple
				onchange={() => {
					chosen = [...(input.files ?? [])].map((f) => f.name);
					if (chosen.length) input.form?.requestSubmit();
				}}
			/>
		</label>
		{#if chosen.length}<p class="muted small">{chosen.join(', ')}</p>{/if}
	</form>

	{#if form?.error}
		<p class="banner">{form.error}</p>
	{/if}

	{#if form && 'results' in form && form.results}
		{#each form.results.filter((r) => r.needs) as r (r.filename)}
			<CsvMap filename={r.filename} content={form.contents?.[r.filename] ?? ''} needs={r.needs!} />
		{/each}
		{#if form.results.some((r) => !r.needs)}
		<section class="card result">
			<h2>Ingelezen</h2>
			<ul>
				{#each form.results.filter((r) => !r.needs) as r}
					<li>
						{#if r.error}
							<span class="neg">{r.filename}: {r.error}</span>
						{:else}
							<span><strong>{r.account}</strong> <span class="muted small">{r.filename}</span></span>
							<span class="num">{r.added} nieuw{#if r.total - r.added > 0}<span class="muted"> · {r.total - r.added} al bekend</span>{/if}</span>
						{/if}
					</li>
				{/each}
			</ul>
			{#if form.categorized > 0}
				<p class="muted small">{form.categorized} boekingen zijn automatisch ingedeeld.</p>
			{/if}
			<a class="btn primary" href="/boekingen?status=open">Naar boekingen die nog ingedeeld moeten worden</a>
		</section>
		{/if}
	{/if}

	{#if data.imports.length}
		<section>
			<h2 class="section-head">Eerdere uploads</h2>
			<ul class="card history">
				{#each data.imports as i}
					<li>
						<span>{i.account} <span class="muted small">{i.filename}</span></span>
						<span class="muted small num">{i.n_new} nieuw · {new Date(i.imported_at + 'Z').toLocaleString('nl-NL', { dateStyle: 'medium', timeStyle: 'short' })}</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: var(--ruimte-3);
	}
	header p {
		margin: 0;
		max-width: 720px;
	}
	form {
		max-width: 720px;
	}
	.drop {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--ruimte-2);
		padding: 48px var(--ruimte-4);
		border: 2px dashed var(--accent-standaard);
		box-shadow: none;
		cursor: pointer;
		text-align: center;
		color: var(--muted);
	}
	.drop strong {
		color: var(--text);
		font: 600 17px/24px var(--tekst-familie);
	}
	.drop-icon {
		display: grid;
		place-items: center;
		width: 64px;
		height: 64px;
		margin-bottom: var(--ruimte-2);
		border-radius: 18px;
		background: var(--verloop-accent);
		color: var(--tekst-op-accent);
	}
	.drop.dragging,
	.drop:hover {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.drop:focus-within {
		outline: 2px solid var(--accent);
	}
	.result {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		align-items: flex-start;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding: 8px 0;
	}
	.history li {
		padding: 11px 14px;
		border-top: 1px solid var(--line);
	}
	.history li:first-child {
		border-top: 0;
	}
	.result p {
		margin: 0;
	}
</style>
