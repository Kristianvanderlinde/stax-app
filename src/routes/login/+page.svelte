<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Inloggen · Stax</title></svelte:head>

<div class="auth">
	<div class="auth-card">
		<img class="auth-logo" src="/icon.svg" alt="" width="56" height="56" />
		<h1>Inloggen</h1>
		<form
			method="POST"
			use:enhance={() => {
				busy = true;
				return async ({ update }) => {
					await update({ reset: false });
					busy = false;
				};
			}}
		>
			<label class="auth-field">
				Naam
				<!-- svelte-ignore a11y_autofocus -->
				<input name="name" autocomplete="username" required autofocus value={form?.name ?? ''} />
			</label>
			<label class="auth-field">
				Wachtwoord
				<input name="password" type="password" autocomplete="current-password" required />
			</label>
			<label class="auth-field">
				Code uit je authenticator
				<input class="auth-code" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="7" placeholder="000000" required />
			</label>
			{#if form?.error}<p class="neg small">{form.error}</p>{/if}
			<button class="primary" disabled={busy}>{busy ? 'Bezig…' : 'Inloggen'}</button>
		</form>
	</div>
</div>
