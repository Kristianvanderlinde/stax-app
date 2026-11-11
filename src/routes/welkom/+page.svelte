<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';

	let { data } = $props();

	const STEPS = $derived([
		{
			icon: 'start',
			title: 'Welkom bij Stax',
			text: 'Stax laat zien wat je deze maand nog kunt uitgeven en wat je opzij zet. Alles draait om budgetten: je verdeelt je geld vooraf, en elke boeking van de bank hoort bij een budget.',
			more: 'Je gegevens blijven op jouw eigen server. Er is geen koppeling met je bank: je uploadt zelf een export.'
		},
		{
			icon: 'upload',
			title: 'Haal je boekingen binnen',
			text: 'Download in je bankapp of internetbankieren een export (camt.053, XML) en upload die. Stax deelt boekingen zo veel mogelijk zelf in; wat het niet weet, zet het in "Nog indelen".',
			href: '/upload',
			action: 'Bankexport uploaden',
			done: data.bookings > 0 ? `${data.bookings} boekingen staan erin` : null
		},
		{
			icon: 'goal',
			title: 'Zet je startsaldo',
			text: 'Voor sparen: kies vanaf welke dag Stax je spaarsaldo bijhoudt en verdeel wat er al op de spaarrekening staat over je budgetten.',
			href: '/instellingen/start',
			action: 'Startsaldo instellen'
		},
		{
			icon: 'folder',
			title: 'Maak je budgetten',
			text: 'Een groep (zoals Wonen) bevat budgetten (zoals Huur). Een budget kan ook sparen of een doel hebben. Stel per maand in hoeveel erin hoort.',
			href: '/instellingen/budgetten',
			action: 'Budgetten bekijken',
			done: data.budgets > 0 ? `${data.budgets} budgetten staan klaar` : null
		},
		{
			icon: 'upload',
			title: 'Bewaar een back-up',
			text: 'Download af en toe een back-up: één bestand met al je gegevens. Raak je je telefoon of server kwijt, dan zet je alles in een paar tikken terug, ook in de app.',
			href: '/instellingen/backup',
			action: 'Back-up maken'
		}
	]);

	let step = $state(0);
	const s = $derived(STEPS[step]);
	const last = $derived(step === STEPS.length - 1);
</script>

<svelte:head><title>Introductie · Stax</title></svelte:head>

<div class="stack welkom">
	<ol class="dots" aria-label="Stappen">
		{#each STEPS as _, i (i)}
			<li><button type="button" class:on={i === step} class:past={i < step} onclick={() => (step = i)} aria-label="Stap {i + 1}" aria-current={i === step}></button></li>
		{/each}
	</ol>

	<div class="card step">
		{#if step === 0}
			<img class="logo" src="/icon.svg" alt="" width="88" height="88" />
		{:else}
			<span class="avatar big"><Icon name={s.icon} size={40} /></span>
		{/if}
		<h1>{s.title}</h1>
		<p>{s.text}</p>
		{#if s.more}<p class="muted small">{s.more}</p>{/if}
		{#if s.done}<p class="small pos">{s.done}</p>{/if}
		{#if s.href}<a class="primary link-btn" href={s.href}>{s.action}</a>{/if}
	</div>

	<form method="POST" action="?/klaar" class="nav">
		<button type="submit" class="plain muted">Overslaan</button>
		<span class="gap"></span>
		{#if step > 0}<button type="button" onclick={() => step--}>Vorige</button>{/if}
		{#if last}
			<button type="submit" class="primary">Aan de slag</button>
		{:else}
			<button type="button" class="primary" onclick={() => step++}>Volgende</button>
		{/if}
	</form>
</div>

<style>
	.welkom {
		max-width: 560px;
		margin: 24px auto;
	}
	.dots {
		display: flex;
		gap: 8px;
		justify-content: center;
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.dots button {
		width: 10px;
		height: 10px;
		padding: 0;
		border-radius: 99px;
		border: 0;
		background: var(--surface-2);
	}
	.dots button.past {
		background: var(--accent-soft);
	}
	.dots button.on {
		width: 26px;
		background: var(--accent);
	}
	.step {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		padding: 28px;
	}
	.logo {
		border-radius: 20px;
	}
	.avatar.big {
		width: 88px;
		height: 88px;
	}
	.step h1 {
		margin: 6px 0 0;
	}
	.step p {
		margin: 0;
		line-height: 1.5;
	}
	.link-btn {
		margin-top: 8px;
		text-decoration: none;
		display: inline-block;
		padding: 10px 16px;
		border-radius: var(--radius-sm);
	}
	.nav {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.gap {
		flex: 1;
	}
	.plain {
		background: none;
		border: 0;
		box-shadow: none;
	}
</style>
