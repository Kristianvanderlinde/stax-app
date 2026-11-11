<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';

	// Klein infoknopje met uitleg in een ballon; houdt tegels rustig zonder de uitleg kwijt te raken.
	// De ballon valt over de breedte van het dichtstbijzijnde element met position: relative (de tegel).
	let { label, children }: { label: string; children: Snippet } = $props();

	let open = $state(false);
	let wrap = $state<HTMLSpanElement>();
</script>

<svelte:window
	onpointerdown={(e) => open && !wrap?.contains(e.target as Node) && (open = false)}
	onkeydown={(e) => open && e.key === 'Escape' && (open = false)}
/>

<span class="info" bind:this={wrap}>
	<button type="button" class="plain" aria-label="Uitleg over {label}" aria-expanded={open} onclick={() => (open = !open)}>
		<Icon name="info" size={17} />
	</button>
	{#if open}
		<span class="tip small" role="tooltip">{@render children()}</span>
	{/if}
</span>

<style>
	.info {
		display: inline-flex;
	}
	button {
		display: inline-flex;
		padding: 2px;
		border-radius: 50%;
		color: var(--faint);
		transition: color 0.15s;
	}
	button:hover,
	button[aria-expanded='true'] {
		color: var(--accent);
	}
	.tip {
		position: absolute;
		z-index: 40;
		top: 46px;
		left: 10px;
		right: 10px;
		padding: 10px 12px;
		border-radius: 12px;
		background: var(--surface);
		color: var(--text);
		font-weight: 400;
		line-height: 1.45;
		box-shadow:
			0 0 0 0.5px var(--line),
			0 12px 34px rgb(20 10 60 / 0.18);
	}
</style>
