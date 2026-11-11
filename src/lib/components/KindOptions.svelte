<script lang="ts">
	import type { Kind } from '$lib/types';

	// Elk budget is een budget; met opties spaart het (het saldo loopt door), eventueel naar een doel.
	let { kind = $bindable() }: { kind: Kind } = $props();

	const rolls = $derived(kind !== 'budget');
	const goal = $derived(kind === 'doelpot');
</script>

<div class="opts">
	<label class="opt">
		<input type="checkbox" checked={rolls} onchange={(e) => (kind = e.currentTarget.checked ? 'spaarpot' : 'budget')} />
		<span>
			<strong>Spaart</strong>
			<span class="hint">
				{rolls
					? 'Het saldo loopt door: wat overblijft blijft staan en de inleg komt er elke maand bij. Het budget staat ook bij Sparen.'
					: 'Elke maand begint het budget opnieuw; wat overblijft vervalt.'}
			</span>
		</span>
	</label>
	<label class="opt">
		<input type="checkbox" checked={goal} onchange={(e) => (kind = e.currentTarget.checked ? 'doelpot' : 'spaarpot')} />
		<span>
			<strong>Doel</strong>
			<span class="hint">Spaar naar een bedrag, eventueel op een datum. Met een doel spaart het budget altijd.</span>
		</span>
	</label>
</div>

<style>
	.opts {
		display: flex;
		flex-direction: column;
		border-radius: var(--radius-sm);
		background: var(--surface-2);
	}
	.opt {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		padding: 12px 14px;
		cursor: pointer;
		color: var(--text);
	}
	.opt + .opt {
		border-top: 0.5px solid var(--line);
	}
	.opt input {
		margin-top: 2px;
		flex-shrink: 0;
	}
	.opt > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	strong {
		font-size: 14.5px;
		font-weight: 560;
	}
	.hint {
		font-size: 13px;
		font-weight: 400;
		color: var(--muted);
	}
</style>
