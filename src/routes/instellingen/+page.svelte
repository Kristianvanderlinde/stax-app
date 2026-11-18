<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { shortDate } from '$lib/format';

	let { data } = $props();

	const tint = (h: string) =>
		h === 'accent' ? '--tint: var(--accent-zacht); --tint-fg: var(--accent-standaard)' : `--tint: var(--categorie-${h}-zacht); --tint-fg: var(--categorie-${h}-tekst)`;

	const ITEMS = $derived([
		{ href: '/instellingen/budgetten', icon: 'folder', hue: 'accent', title: 'Budgetten', sub: `${data.budgets} budgetten · aanmaken, opties en indeling` },
		{ href: '/instellingen/regels', icon: 'list', hue: 'lucht', title: 'Regels', sub: `${data.rules} eigen regels voor automatisch indelen` },
		{ href: '/instellingen/rekeningen', icon: 'card', hue: 'mint', title: 'Rekeningen', sub: `${data.accounts} ${data.accounts === 1 ? 'rekening' : 'rekeningen'}` },
		{ href: '/instellingen/account', icon: 'shield', hue: 'zon', title: 'Account', sub: 'Uitloggen en bepalen wie toegang heeft' },
		{ href: '/instellingen/backup', icon: 'upload', hue: 'lucht', title: 'Back-up', sub: 'Al je gegevens bewaren in één bestand of terugzetten' },
		{ href: '/welkom', icon: 'start', hue: 'koraal', title: 'Introductie', sub: 'Loop de eerste stappen met Stax nog eens door' },
		{
			href: '/instellingen/start',
			icon: 'goal',
			hue: 'accent',
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
					<span class="tegel" style={tint(it.hue)}><Icon name={it.icon} size={20} /></span>
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
		padding: var(--ruimte-2);
	}
	.item {
		display: flex;
		align-items: center;
		position: relative;
		gap: var(--ruimte-4);
		padding: var(--ruimte-3) var(--ruimte-4);
		border-radius: var(--vorm-lg);
		transition: background-color 0.15s;
	}
	.item:hover {
		background: var(--surface-2);
	}
	li + li .item::before {
		content: '';
		position: absolute;
		top: 0;
		left: var(--ruimte-4);
		right: var(--ruimte-4);
		border-top: 1px solid var(--line);
	}
	.item:hover::before,
	li:hover + li .item::before {
		opacity: 0;
	}
	.names {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	.names strong {
		font-weight: 600;
	}
	.tegel {
		flex: none;
		display: grid;
		place-items: center;
		width: 40px;
		height: 40px;
		border-radius: var(--vorm-lg);
		background: var(--tint);
		color: var(--tint-fg);
	}
	.item > :global(svg:last-child) {
		color: var(--faint);
	}
</style>
