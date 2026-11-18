<script lang="ts">
	import { Terugknop } from 'vertex/web';
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';

	let { data, form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Back-up · Stax</title></svelte:head>

<div class="stack">
	<header>
		<Terugknop href="/instellingen">Instellingen</Terugknop>
		<h1>Back-up</h1>
		<p class="muted">Eén bestand met al je gegevens: rekeningen, boekingen, budgetten, regels en startsaldo. Zonder inloggegevens. Het past ook in de app op je telefoon.</p>
	</header>

	<section class="card pad">
		<h2>Back-up maken</h2>
		<p class="muted">Nu {data.transactions} boekingen op {data.accounts} {data.accounts === 1 ? 'rekening' : 'rekeningen'}. Bewaar het bestand op een veilige plek, het bevat je hele financiële administratie.</p>
		<a class="btn primary" href="/instellingen/backup/bestand" data-sveltekit-reload><Icon name="download" size={16} /> Back-up downloaden</a>
	</section>

	<section class="card pad">
		<h2>Back-up terugzetten</h2>
		<p class="muted">Alles wat nu in Stax staat wordt vervangen door de inhoud van de back-up. Maak eerst een back-up als je de huidige gegevens wilt bewaren.</p>
		<form
			method="POST"
			action="?/terugzetten"
			enctype="multipart/form-data"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update();
					busy = false;
				};
			}}
		>
			<input type="file" name="bestand" accept=".json,application/json" required />
			<label class="check"><input type="checkbox" name="akkoord" value="ja" /> Ik weet dat alle huidige gegevens vervangen worden.</label>
			{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
			{#if form?.restored}
				<p class="ok" role="status">Teruggezet: {form.restored.accounts} rekeningen, {form.restored.transactions} boekingen en {form.restored.budgets} budgetten.</p>
			{/if}
			<button class="danger" disabled={busy}>{busy ? 'Bezig…' : 'Terugzetten'}</button>
		</form>
	</section>
</div>

<style>
	.pad {
		padding: 18px 20px;
		max-width: 720px;
		display: grid;
		gap: 12px;
	}
	h2 {
		margin: 0;
	}
	p {
		margin: 0;
	}
	form {
		display: grid;
		gap: 12px;
	}
	.check {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.error {
		color: var(--danger, #c0392b);
	}
	.ok {
		color: var(--ok, #2e7d32);
	}
	.btn,
	.danger {
		justify-self: start;
	}
</style>
