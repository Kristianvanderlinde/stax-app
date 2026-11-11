<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { shortDate } from '$lib/format';

	let { data } = $props();

	const ITEMS = $derived([
		{ href: '/instellingen/budgetten', icon: 'folder', title: 'Budgetten', sub: `${data.budgets} budgetten · aanmaken, opties en indeling` },
		{ href: '/instellingen/regels', icon: 'list', title: 'Regels', sub: `${data.rules} eigen regels voor automatisch indelen` },
		{ href: '/instellingen/rekeningen', icon: 'card', title: 'Rekeningen', sub: `${data.accounts} ${data.accounts === 1 ? 'rekening' : 'rekeningen'}` },
		{ href: '/instellingen/account', icon: 'shield', title: 'Account', sub: 'Uitloggen en bepalen wie toegang heeft' },
		{ href: '/instellingen/backup', icon: 'upload', title: 'Back-up', sub: 'Al je gegevens bewaren in één bestand of terugzetten' },
		{ href: '/welkom', icon: 'start', title: 'Introductie', sub: 'Loop de eerste stappen met Stax nog eens door' },
		{
			href: '/instellingen/start',
			icon: 'goal',
			title: 'Startsaldo',
			sub: data.startdatum ? `Spaarsaldi tellen vanaf ${shortDate(data.startdatum)}` : 'Nog niet ingesteld'
		}
	]);
</script>

<svelte:head><title>Instellingen · Stax</title></svelte:head>

<div class="stack">
	<h1>Instellingen</h1>
	<ul class="card list">
		{#each ITEMS as it (it.href)}
			<li>
				<a class="item" href={it.href}>
					<span class="avatar sm"><Icon name={it.icon} size={18} /></span>
					<span class="names">
						<strong>{it.title}</strong>
						<span class="muted small">{it.sub}</span>
					</span>
					<Icon name="right" size={16} />
				</a>
			</li>
		{/each}
	</ul>
</div>

<style>
	/* Geen ruimte boven en onder en overloop afgesneden, zodat de hover de ronde hoeken van de kaart volgt. */
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		max-width: 720px;
		overflow: hidden;
	}
	.item {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 12px 18px;
		transition: background-color 0.15s;
	}
	.item:hover {
		background: var(--surface-2);
	}
	li + li .item {
		border-top: 0.5px solid var(--line);
	}
	.names {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.names strong {
		font-weight: 600;
	}
	.item > :global(svg:last-child) {
		color: var(--faint);
	}
</style>
