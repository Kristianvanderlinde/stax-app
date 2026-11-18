<script lang="ts" module>
	import type { Behavior, Funding, Kind } from '$lib/types';
	export interface EditNode {
		id: number;
		name: string;
		tree: 'uitgaven' | 'inkomsten';
		depth: number;
		parent_id: number | null;
		behavior: Behavior | null;
		kind: Kind;
		inherited: Behavior;
		funding: Funding | null;
		effFunding: Funding;
		icon: string | null;
		effIcon: string | null;
		color: string | null;
		goal_cents: number | null;
		goal_date: string | null;
		bookings: number;
		childCount: number;
		descendants: number[];
		/** Eigen budget deze maand. */
		ownBudget: number | null;
		/** Een groep telt alleen de budgetten eronder op; hij heeft zelf geen soort, doel of boekingen. */
		group: boolean;
	}
</script>

<script lang="ts">
	import { Segmentbalk } from 'vertex/web';
	import { HUES, HUE_NAMES, hueOf, hueStyle } from '$lib/hue';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import CategoryCombo from './CategoryCombo.svelte';
	import Icon from './Icon.svelte';
	import { MATERIAL_GROUPS } from '$lib/material-icons';
	import KindOptions from './KindOptions.svelte';
	import { moneyInput } from '$lib/format';
	import type { CatOption } from '$lib/types';

	let { node, options, onclose, error = '' }: { node: EditNode; options: CatOption[]; onclose: () => void; error?: string } = $props();

	let dialog = $state<HTMLDialogElement>();
	let confirmDelete = $state(false);
	let iconQuery = $state('');
	const iconGroups = $derived.by(() => {
		const q = iconQuery.trim().toLowerCase();
		return MATERIAL_GROUPS.map(([group, icons]) => [group, q ? icons.filter(([name, words]) => words.includes(q) || name.includes(q)) : icons] as const).filter(
			([, icons]) => icons.length
		);
	});
	let draft = $state({ name: '', icon: '', color: '', kind: 'budget' as Kind, funding: 'spaar' as Funding, goal: '', parent_id: 0 });

	// Doeldatum: een jaar, een maand of een precieze dag.
	type Precision = 'jaar' | 'maand' | 'dag';
	let precision = $state<Precision>('maand');
	let goalYear = $state('');
	let goalMonth = $state('');
	let goalDay = $state('');
	const MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
	const goalDate = $derived(
		precision === 'dag' ? goalDay : !/^\d{4}$/.test(goalYear) ? '' : precision === 'jaar' ? goalYear : goalMonth ? `${goalYear}-${goalMonth}` : ''
	);

	// Velden opnieuw vullen zodra een andere map geopend wordt. Soort en rekening worden altijd expliciet opgeslagen.
	$effect.pre(() => {
		draft = {
			name: node.name,
			icon: node.icon ?? '',
			color: node.color ?? '',
			kind: node.kind,
			funding: node.effFunding,
			goal: moneyInput(node.goal_cents),
			parent_id: node.parent_id ?? 0
		};
		const d = node.goal_date ?? '';
		precision = d.length === 4 ? 'jaar' : d.length === 10 ? 'dag' : 'maand';
		goalYear = d.slice(0, 4);
		goalMonth = d.slice(5, 7);
		goalDay = d.length === 10 ? d : '';
		confirmDelete = false;
	});

	$effect(() => {
		dialog?.showModal();
	});

	const isRoot = $derived(node.depth === 0);

	const done = () => {
		return async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			if (result.type === 'success') onclose();
		};
	};
</script>

<dialog bind:this={dialog} class="sheet" onclose={onclose} aria-labelledby="ed-title">
	<header class="ed-head">
		<span class="avatar"><Icon name={isRoot ? 'folder' : draft.icon || node.effIcon} size={22} /></span>
		<h2 id="ed-title">{draft.name || node.name}</h2>
		<button type="button" class="icon" aria-label="Sluiten" onclick={() => dialog?.close()}><Icon name="x" size={18} /></button>
	</header>

	<div class="ed-body">
		{#if error}<p class="banner warn small">{error}</p>{/if}

		{#if isRoot}
			<p class="muted">Dit is het hoofdniveau van alle {node.name.toLowerCase()}. Voeg hier groepen of budgetten aan toe.</p>
		{:else}
			<form id="ed-form" method="POST" action="?/opslaan" use:enhance={done} class="ed-form">
				<input type="hidden" name="icon" value={draft.icon} />
				<input type="hidden" name="color" value={draft.color} />
				<input type="hidden" name="kind" value={node.tree === 'uitgaven' ? draft.kind : ''} />
				<input type="hidden" name="funding" value={draft.kind !== 'budget' ? draft.funding : ''} />
				<input type="hidden" name="id" value={node.id} />
				<input type="hidden" name="parent_id" value={draft.parent_id} />

				<label class="field">Naam <input name="name" bind:value={draft.name} required /></label>

				{#if node.group && node.tree === 'uitgaven'}
					<div class="field">
						<span>Kleur</span>
						<div class="kleuren" role="radiogroup" aria-label="Kleur van de groep">
							{#each HUES as h (h)}
								<button
									type="button"
									class="plain kleur"
									role="radio"
									aria-checked={(draft.color || hueOf(node.id, page.data.groupHues ?? {})) === h}
									aria-label={HUE_NAMES[h]}
									title={HUE_NAMES[h]}
									style={hueStyle(node.id, {}, h)}
									onclick={() => (draft.color = h)}
								></button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="field">
					<span>Icoon</span>
					<input type="search" class="iconsearch" placeholder="Zoek een icoon, bijv. auto of vakantie" bind:value={iconQuery} />
					<div class="iconlist" role="radiogroup" aria-label="Icoon">
						{#if !iconQuery.trim() && !node.group && node.tree === 'uitgaven'}
							<button type="button" class="plain ic auto" role="radio" aria-checked={!draft.icon} title="Zelfde als de groep" onclick={() => (draft.icon = '')}>
								<span class="small">zelfde als groep</span>
							</button>
						{/if}
						{#each iconGroups as [group, icons] (group)}
							<span class="icongroup small">{group}</span>
							<div class="icons">
								{#each icons as [ic, words] (ic)}
									<button type="button" class="plain ic" role="radio" aria-checked={draft.icon === ic} aria-label={words} title={words} onclick={() => (draft.icon = ic)}>
										<Icon name={ic} size={20} />
									</button>
								{/each}
							</div>
						{:else}
							<span class="hint">Geen icoon gevonden voor “{iconQuery}”.</span>
						{/each}
					</div>
				</div>

				{#if node.group}
					<p class="hint">
						Dit is een groep met {node.childCount} {node.childCount === 1 ? 'budget' : 'budgetten'}. Een groep telt alleen op; boekingen en bedragen
						horen bij de budgetten erin.
					</p>
				{:else if node.tree === 'uitgaven'}
					<div class="field">
						<span>Opties</span>
						<KindOptions bind:kind={draft.kind} />
					</div>

					{#if draft.kind !== 'budget'}
						<label class="check-row">
							<input type="checkbox" checked={draft.funding === 'spaar'} onchange={(e) => (draft.funding = e.currentTarget.checked ? 'spaar' : 'betaal')} />
							<span>
								Geld staat apart op de spaarrekening
								<span class="hint">
									{draft.funding === 'spaar'
										? 'Inleg komt binnen via een overboeking naar de spaarrekening.'
										: 'Het geld blijft op de betaalrekening; de geplande inleg komt er elke maand vanzelf bij.'}
								</span>
							</span>
						</label>
					{/if}

					{#if draft.kind === 'doelpot'}
						<label class="field">
							Doelbedrag
							<input name="goal" inputmode="decimal" placeholder="Bijv. 1.200,00" bind:value={draft.goal} required />
						</label>
						<div class="field">
							<span>Moet er zijn</span>
							<input type="hidden" name="goal_date" value={goalDate} />
							<Segmentbalk
								vol
								label="Hoe precies"
								bind:waarde={precision}
								opties={[
									{ waarde: 'jaar', label: 'In een jaar' },
									{ waarde: 'maand', label: 'In een maand' },
									{ waarde: 'dag', label: 'Op een datum' }
								]}
							/>
							{#if precision === 'dag'}
								<input type="date" aria-label="Datum" bind:value={goalDay} />
							{:else}
								<div class="two">
									{#if precision === 'maand'}
										<select aria-label="Maand" bind:value={goalMonth}>
											<option value="">Maand…</option>
											{#each MONTHS as m, i}<option value={String(i + 1).padStart(2, '0')}>{m}</option>{/each}
										</select>
									{/if}
									<input aria-label="Jaar" inputmode="numeric" maxlength="4" placeholder="Jaar, bijv. {new Date().getFullYear() + 1}" bind:value={goalYear} />
								</div>
							{/if}
							<span class="hint">Leeg laten mag: dan is er geen einddatum en houdt Stax geen schema bij.</span>
						</div>
					{/if}
					<span class="hint">Het bedrag per maand pas je aan in het budgetoverzicht of op de pagina zelf.</span>
				{/if}

				{#if !node.group && node.tree === 'uitgaven'}
					<div class="field">
						<span>In groep</span>
						<CategoryCombo
							label="In groep"
							{options}
							filter={(o) => o.tree === 'uitgaven' && o.depth === 1}
							value={draft.parent_id}
							onchange={(id) => id && (draft.parent_id = id)}
						/>
					</div>
				{/if}
			</form>
		{/if}
	</div>

	<footer class="ed-foot">
		{#if confirmDelete}
			<div class="confirm">
				<span class="small">
					{node.group
						? 'Weet je zeker dat je deze lege groep wilt verwijderen?'
						: node.bookings
							? `De ${node.bookings} ${node.bookings === 1 ? 'boeking moet' : 'boekingen moeten'} je daarna opnieuw indelen.`
							: 'Weet je zeker dat je dit budget wilt verwijderen?'}
				</span>
				<div class="pair">
					<button class="danger" form="ed-form" formaction="?/verwijderen" formnovalidate>Ja, verwijderen</button>
					<button type="button" class="ghost" onclick={() => (confirmDelete = false)}>Nee</button>
				</div>
			</div>
		{:else}
			{#if !isRoot}<button class="primary save" form="ed-form">Opslaan</button>{/if}
			<div class="pair">
				{#if node.group && node.childCount}
					<span class="hint small">Een groep met budgetten kan niet weg. Verplaats of verwijder eerst de budgetten.</span>
				{:else if !isRoot}
					<button type="button" class="ghost danger" onclick={() => (confirmDelete = true)}>Verwijderen</button>
				{/if}
			</div>
		{/if}
	</footer>
</dialog>

<style>
	.sheet {
		margin: 0 0 0 auto;
		height: 100dvh;
		max-height: 100dvh;
		width: min(440px, 100vw);
		padding: 22px;
		border: 0;
		border-radius: 22px 0 0 22px;
		background: var(--surface);
		color: var(--text);
		box-shadow: -20px 0 60px rgb(0 0 0 / 0.2);
		display: flex;
		flex-direction: column;
		gap: 16px;
		animation: slide 0.28s var(--ease);
	}
	.sheet:not([open]) {
		display: none;
	}
	.sheet:focus {
		outline: none;
	}
	.sheet::backdrop {
		background: rgb(20 20 30 / 0.35);
	}
	@keyframes slide {
		from {
			transform: translateX(40px);
			opacity: 0;
		}
	}
	@media (max-width: 700px) {
		.sheet {
			margin: auto 0 0;
			width: 100vw;
			max-width: 100vw;
			height: auto;
			max-height: 90dvh;
			border-radius: 22px 22px 0 0;
			padding-bottom: calc(22px + env(safe-area-inset-bottom));
			animation-name: up;
		}
		@keyframes up {
			from {
				transform: translateY(40px);
				opacity: 0;
			}
		}
	}
	.ed-head {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.ed-head h2 {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.ed-body {
		flex: 1;
		min-height: 0;
		overflow: auto;
		margin: 0 -22px;
		padding: 0 22px 4px;
	}
	.ed-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.check-row {
		display: flex;
		gap: 12px;
		align-items: flex-start;
		font-size: 14.5px;
		cursor: pointer;
	}
	.check-row input {
		margin-top: 2px;
	}
	.check-row > span {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	/* Onderaan vast: opslaan over de hele breedte, daaronder verwijderen. */
	.ed-foot {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 14px;
		border-top: 0.5px solid var(--line);
	}
	.save {
		width: 100%;
	}
	.pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}
	.confirm {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 7px;
		font-size: 13px;
		font-weight: 500;
		color: var(--muted);
	}
	.hint {
		font-weight: 400;
		font-size: 13px;
		color: var(--muted);
	}
	.iconlist {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-height: 300px;
		overflow: auto;
		padding-right: 2px;
	}
	.icongroup {
		margin-top: 6px;
		color: var(--faint);
		font-weight: 600;
	}
	.icons {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
		gap: 6px;
	}
	.ic.auto {
		height: 34px;
		color: var(--muted);
	}
	.ic {
		display: grid;
		place-items: center;
		height: 38px;
		border-radius: 10px;
		color: var(--text);
		background: var(--surface-2);
		transition: background-color 0.15s;
	}
	.ic:hover {
		background: var(--fill);
	}
	.ic[aria-checked='true'] {
		background: var(--gradient);
		color: #fff;
	}
	.kleuren {
		display: flex;
		gap: var(--ruimte-3);
	}
	.kleur {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--solid);
		box-shadow: inset 0 0 0 2px var(--surface);
		border: 2px solid transparent;
	}
	.kleur[aria-checked='true'] {
		border-color: var(--text);
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}
</style>
