<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	// Bij een fout stuurt de server hetzelfde geheim terug, zodat je niet opnieuw hoeft te scannen.
	const secret = $derived(form?.secret || data.secret);
	const qr = $derived(form?.qr || data.qr);
</script>

<svelte:head><title>Account aanmaken · Stax</title></svelte:head>

<div class="auth">
	<div class="auth-card wide">
		<img class="auth-logo" src="/icon.svg" alt="" width="56" height="56" />
		<h1>Welkom bij Stax</h1>
		<p class="muted">Maak het eerste account aan. Daarna kun je in Instellingen → Account nog iemand toevoegen.</p>
		<form method="POST" use:enhance={() => async ({ update }) => update({ reset: false })}>
			<input type="hidden" name="secret" value={secret} />
			<label class="auth-field">
				Installatiecode
				<input name="setup" autocomplete="off" required placeholder="Staat in de log van de server" />
				<span class="small">Deze code staat in de log van de Stax-container (bijvoorbeeld met <code>docker compose logs stax</code>).</span>
			</label>
			<label class="auth-field">
				Naam
				<input name="name" autocomplete="username" required value={form?.name ?? ''} />
			</label>
			<label class="auth-field">
				Wachtwoord (minstens 12 tekens)
				<input name="password" type="password" autocomplete="new-password" required minlength="12" />
			</label>
			<label class="auth-field">
				Wachtwoord nog een keer
				<input name="repeat" type="password" autocomplete="new-password" required minlength="12" />
			</label>
			<div class="totp">
				<div class="qr" aria-label="QR-code voor je authenticator">{@html qr}</div>
				<div class="auth-field">
					<span>Scan de QR-code met een authenticator-app of wachtwoordmanager. Of voer de sleutel met de hand in:</span>
					<code class="secret">{secret.replace(/(.{4})/g, '$1 ').trim()}</code>
				</div>
			</div>
			<label class="auth-field">
				Code uit je authenticator
				<input class="auth-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="000000" required />
			</label>
			{#if form?.error}<p class="neg small">{form.error}</p>{/if}
			<button class="primary">Account aanmaken</button>
		</form>
	</div>
</div>

<style>
	.totp {
		display: grid;
		grid-template-columns: 150px 1fr;
		gap: 16px;
		align-items: center;
	}
	.qr {
		padding: 8px;
		border-radius: 12px;
		background: #fff;
	}
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	.secret {
		font-size: 14px;
		color: var(--text);
		word-break: break-all;
	}
	@media (max-width: 480px) {
		.totp {
			grid-template-columns: 1fr;
		}
		.qr {
			width: 180px;
		}
	}
</style>
