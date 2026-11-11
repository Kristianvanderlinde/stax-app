<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '$lib/components/Icon.svelte';
	import { shortDate } from '$lib/format';

	let { data, form } = $props();
</script>

<svelte:head><title>Account · Stax</title></svelte:head>

<div class="stack">
	<header>
		<a class="link back" href="/instellingen"><Icon name="left" size={18} /> Instellingen</a>
		<h1>Account</h1>
		<p class="muted">Ingelogd als <strong>{data.me?.name}</strong>.</p>
	</header>

	<section>
		<div class="section-head"><h2>Naam</h2></div>
		<form class="card pad" method="POST" action="?/naam" use:enhance>
			<label class="field">
				Naam
				<input name="name" autocomplete="username" required value={data.me?.name ?? ''} />
			</label>
			{#if form?.which === 'naam' && form.error}<p class="msg bad" role="alert">{form.error}</p>{/if}
			{#if form?.saved === 'naam'}<p class="msg ok" role="status">Naam bewaard.</p>{/if}
			<button class="primary">Naam bewaren</button>
		</form>
	</section>

	<section>
		<div class="section-head"><h2>Wachtwoord</h2></div>
		<form class="card pad" method="POST" action="?/wachtwoord" use:enhance={() => async ({ update }) => update({ reset: true })}>
			<label class="field">
				Huidig wachtwoord
				<input name="current" type="password" autocomplete="current-password" required />
			</label>
			<label class="field">
				Nieuw wachtwoord
				<input name="next" type="password" autocomplete="new-password" minlength="12" required />
			</label>
			<label class="field">
				Nieuw wachtwoord nog een keer
				<input name="repeat" type="password" autocomplete="new-password" minlength="12" required />
			</label>
			<p class="muted small">Minstens 12 tekens. Na een wijziging worden je andere sessies en telefoons uitgelogd.</p>
			{#if form?.which === 'wachtwoord' && form.error}<p class="msg bad" role="alert">{form.error}</p>{/if}
			{#if form?.saved === 'wachtwoord'}<p class="msg ok" role="status">Wachtwoord gewijzigd.</p>{/if}
			<button class="primary">Wachtwoord wijzigen</button>
		</form>
	</section>

	<section>
		<div class="section-head"><h2>Telefoons met de app</h2></div>
		<ul class="card list">
			{#each data.devices as d (d.id)}
				<li>
					<span class="avatar soft sm"><Icon name="mobile" size={17} /></span>
					<span class="name">
						{d.name}<span class="muted small"> · {d.user} · {d.last_used_at ? `laatst gebruikt ${shortDate(d.last_used_at.slice(0, 10))}` : `ingelogd ${shortDate(d.created_at.slice(0, 10))}`}</span>
					</span>
					<form method="POST" action="?/apparaat" use:enhance>
						<input type="hidden" name="id" value={d.id} />
						<button class="ghost danger small">Toegang intrekken</button>
					</form>
				</li>
			{:else}
				<li class="muted small">Nog geen telefoon ingelogd met de app.</li>
			{/each}
		</ul>
	</section>

	<form method="POST" action="/logout">
		<button class="danger">Uitloggen</button>
	</form>
</div>

<style>
	.pad {
		padding: 16px 18px;
		max-width: 720px;
		display: grid;
		gap: 12px;
	}
	.pad button {
		justify-self: start;
	}
	.pad p,
	.msg {
		margin: 0;
	}
	.msg.bad {
		color: var(--neg);
	}
	.msg.ok {
		color: var(--pos);
	}
	header p {
		margin: 6px 0 0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: 720px;
		overflow: hidden;
	}
	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
	}
	.list li + li {
		border-top: 0.5px solid var(--line);
	}
	.name {
		flex: 1;
		font-weight: 560;
	}
</style>
