<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	// Gekozen soort per rekening, pas bewaard bij Opslaan.
	let kinds = $state<Record<number, string>>({});
	const kindOf = (a: { id: number; kind: string }) => kinds[a.id] ?? a.kind;
</script>

<svelte:head><title>Rekeningen · Stax</title></svelte:head>

<div class="stack">
	<header>
		<a class="link back" href="/instellingen"><Icon name="left" size={18} /> Instellingen</a>
		<h1>Rekeningen</h1>
		<p class="muted">Rekeningen verschijnen vanzelf na een upload. Op een spaarrekening houdt Stax per budget het spaarsaldo bij.</p>
	</header>
	{#if form?.error}<p class="banner">{form.error}</p>{/if}

	<ul class="card list">
		{#each data.accounts as a (a.id)}
			<li>
				<form method="POST" class="acct" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<input type="hidden" name="id" value={a.id} />
					<input type="hidden" name="kind" value={kindOf(a)} />
					<label class="field">Naam <input name="name" value={a.name} /></label>
					<div class="field">
						<span>Soort</span>
						<div class="seg" role="group" aria-label="Soort rekening">
							<button type="button" aria-pressed={kindOf(a) === 'betaal'} onclick={() => (kinds[a.id] = 'betaal')}>Betaalrekening</button>
							<button type="button" aria-pressed={kindOf(a) === 'spaar'} onclick={() => (kinds[a.id] = 'spaar')}>Spaarrekening</button>
						</div>
					</div>
					<span class="muted small iban">{a.iban.replace(/(.{4})/g, '$1 ').trim()}</span>
					<button class="primary">Opslaan</button>
				</form>
			</li>
		{:else}
			<li class="empty small">Rekeningen verschijnen hier na de eerste upload.</li>
		{/each}
	</ul>
</div>

<style>
	header p {
		margin: 6px 0 0;
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
	.acct {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 12px;
		padding: 16px;
		align-items: end;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 7px;
		font-size: 13px;
		font-weight: 500;
		color: var(--muted);
	}
	.iban {
		align-self: center;
	}
	.acct button.primary {
		justify-self: end;
	}
	@media (max-width: 600px) {
		.acct {
			grid-template-columns: 1fr;
		}
	}
</style>
