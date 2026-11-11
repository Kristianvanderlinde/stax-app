<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import Icon from '$lib/components/Icon.svelte';

	let { data, children } = $props();

	const NAV = [
		{ href: '/', label: 'Budgetoverzicht', icon: 'start' },
		{ href: '/sparen', label: 'Sparen', icon: 'piggy' },
		{ href: '/boekingen', label: 'Boekingen', icon: 'list' },
		{ href: '/instellingen', label: 'Instellingen', icon: 'settings' }
	] as const;

	// Zijbalk op desktop in- of uitgeklapt; de keuze blijft bewaard in deze browser.
	let collapsed = $state(false);
	let ready = $state(false);
	$effect(() => {
		try {
			collapsed = localStorage.getItem('stax-zijbalk') === 'in';
		} catch {
			// Zonder opslag begint de zijbalk gewoon uitgeklapt.
		}
		// Pas na het inlezen animeren, anders schuift de balk bij het laden.
		requestAnimationFrame(() => (ready = true));
	});
	function toggle() {
		collapsed = !collapsed;
		try {
			localStorage.setItem('stax-zijbalk', collapsed ? 'in' : 'uit');
		} catch {
			// Niet erg: dan geldt de keuze alleen voor nu.
		}
	}

	function active(href: string) {
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head><title>Stax</title></svelte:head>

{#if ['/login', '/setup'].includes(page.url.pathname)}
	{@render children()}
{:else}
<div class="shell" class:collapsed class:ready>
	<nav aria-label="Hoofdmenu">
		<a class="brand" href="/" aria-label="Stax, naar budgetoverzicht">
			<span class="wordmark" aria-hidden="true">$TAX</span>
			<img class="brand-icon" src="/icon.svg" alt="" width="44" height="44" />
		</a>
		<ul>
			{#each NAV as item}
				<li>
					<a href={item.href} aria-current={active(item.href) ? 'page' : undefined} title={item.label}>
						<span class="bubble"><Icon name={item.icon} size={22} /></span>
						<span class="label">{item.label}</span>
						{#if item.href === '/boekingen' && data.openCount > 0}
							<b class="badge" aria-label="{data.openCount} nog in te delen">{data.openCount > 99 ? '99+' : data.openCount}</b>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
		<button type="button" class="plain collapse" onclick={toggle} aria-expanded={!collapsed} title={collapsed ? 'Uitklappen' : 'Inklappen'}>
			<span class="bubble"><Icon name="sidebar" size={20} /></span>
			<span class="label">{collapsed ? 'Uitklappen' : 'Inklappen'}</span>
		</button>
	</nav>
	<main>
		<div class="content">
			<!-- Op de telefoon staat het logo als icoon bovenaan; de zijbalk met het woordmerk is er dan niet. -->
			<a class="mobile-brand" href="/" aria-label="Stax, naar budgetoverzicht"><img src="/icon.svg" alt="" width="40" height="40" /></a>
			{@render children()}
		</div>
	</main>
</div>
{/if}

<style>
	.shell {
		min-height: 100dvh;
	}
	.content {
		max-width: 1240px;
		margin: 0 auto;
	}
	.collapse {
		display: none;
	}
	main {
		padding: calc(20px + env(safe-area-inset-top)) 16px calc(110px + env(safe-area-inset-bottom));
	}

	/* Telefoon: zwevende balk met iconen, actief item in een bolletje. */
	nav {
		position: fixed;
		z-index: 20;
		left: 12px;
		right: 12px;
		bottom: calc(10px + env(safe-area-inset-bottom));
		max-width: 400px;
		margin: 0 auto;
		background: color-mix(in srgb, var(--bg) 88%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-radius: 26px;
		box-shadow: var(--float);
		border: 1px solid var(--line);
	}
	.brand {
		display: none;
	}
	.mobile-brand {
		display: block;
		width: 40px;
		margin-bottom: 14px;
	}
	.mobile-brand img {
		display: block;
		border-radius: 11px;
		box-shadow: 0 6px 18px rgb(90 70 220 / 0.3);
	}
	ul {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		margin: 0;
		padding: 8px;
		list-style: none;
	}
	ul a {
		position: relative;
		display: flex;
		justify-content: center;
		color: var(--muted);
		text-decoration: none;
	}
	.bubble {
		display: grid;
		place-items: center;
		width: 52px;
		height: 52px;
		border-radius: 50%;
	}
	ul a[aria-current='page'] {
		color: var(--accent);
	}
	ul a[aria-current='page'] .bubble {
		background: var(--accent-soft);
	}
	.label {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
	.badge {
		position: absolute;
		top: 4px;
		left: calc(50% + 8px);
		min-width: 20px;
		height: 20px;
		padding: 0 5px;
		border-radius: 99px;
		background: #e5484d;
		color: #fff;
		font-size: 11px;
		line-height: 20px;
		text-align: center;
		box-shadow: 0 0 0 2px var(--bg);
	}

	/* Desktop: zwevende zijbalk die je kunt inklappen tot alleen iconen. */
	@media (min-width: 860px) {
		.shell {
			--nav-w: 248px;
		}
		.shell.collapsed {
			--nav-w: 76px;
		}
		nav {
			inset: 16px auto 16px 16px;
			width: var(--nav-w);
			max-width: none;
			margin: 0;
			display: flex;
			flex-direction: column;
			padding: 26px 14px 14px;
			border-radius: 24px;
			border: 0.5px solid var(--line);
			background: var(--surface);
			box-shadow: var(--float);
			overflow: hidden;
		}
		.ready nav,
		.ready main {
			transition: width 0.25s var(--ease), padding-left 0.25s var(--ease);
		}
		.mobile-brand {
			display: none;
		}
		.brand {
			display: block;
			padding: 0 10px 30px;
			font-size: 44px;
			line-height: 1;
			text-decoration: none;
			white-space: nowrap;
		}
		.brand-icon {
			display: none;
			border-radius: 12px;
		}
		.collapsed .brand {
			padding: 0 0 26px;
		}
		.collapsed .wordmark {
			display: none;
		}
		.collapsed .brand-icon {
			display: block;
		}
		ul {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 0;
		}
		ul a,
		.collapse {
			display: flex;
			justify-content: flex-start;
			align-items: center;
			gap: 4px;
			padding: 5px 12px 5px 5px;
			border-radius: 14px;
			font-size: 16px;
			font-weight: 560;
			color: var(--text);
			white-space: nowrap;
			transition: background-color 0.15s;
		}
		.collapse {
			margin-top: auto;
			width: 100%;
			color: var(--muted);
			font-weight: 500;
			font-size: 14.5px;
		}
		.bubble {
			flex-shrink: 0;
			width: 40px;
			height: 40px;
			color: var(--muted);
		}
		ul a:hover,
		.collapse:hover {
			background: var(--fill);
		}
		ul a[aria-current='page'] {
			background: var(--accent-soft);
			color: var(--accent);
		}
		ul a[aria-current='page'] .bubble {
			background: none;
			color: var(--accent);
		}
		.label {
			position: static;
			width: auto;
			height: auto;
			clip: auto;
		}
		.badge {
			position: static;
			margin-left: auto;
			box-shadow: none;
		}
		/* Ingeklapt: alleen de iconen, het aantal als bolletje op het icoon. */
		.collapsed .label {
			display: none;
		}
		/* Ingeklapt: elk icoon precies in het midden van zijn knop, en de knop in het midden van de balk. */
		.collapsed ul a,
		.collapsed .collapse {
			justify-content: center;
			width: 100%;
			padding: 4px 0;
			gap: 0;
		}
		.collapsed .brand-icon {
			margin: 0 auto;
		}
		.collapsed .badge {
			position: absolute;
			top: 0;
			left: 30px;
			margin: 0;
			box-shadow: 0 0 0 2px var(--surface);
		}
		main {
			padding: 44px 48px 64px calc(var(--nav-w) + 16px + 48px);
		}
	}
</style>
