<script lang="ts">
	import { hueStyle } from '$lib/hue';
	import { Terugknop } from 'vertex/web';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CategoryCombo from '$lib/components/CategoryCombo.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import KindOptions from '$lib/components/KindOptions.svelte';
	import MapEditor from '$lib/components/MapEditor.svelte';
	import { kindTag, type Kind } from '$lib/types';

	let { data, form } = $props();

	type Item = (typeof data.groups)[number]['budgets'][number];

	// --- Zijpaneel: ?bewerk=<id> ---
	const editHref = (id: number) => `?bewerk=${id}`;
	function closeEditor() {
		const url = new URL(page.url);
		url.searchParams.delete('bewerk');
		goto(url, { replaceState: true, noScroll: true, keepFocus: true });
	}

	// --- Nieuw budget of nieuwe groep ---
	let newBudget = $state<{ tree: 'uitgaven' | 'inkomsten'; parent: number; kind: Kind } | null>(null);
	let newGroup = $state(false);
	let budgetDialog = $state<HTMLDialogElement>();
	let groupDialog = $state<HTMLDialogElement>();
	function startBudget(tree: 'uitgaven' | 'inkomsten', parent: number) {
		newBudget = { tree, parent, kind: 'budget' };
		queueMicrotask(() => budgetDialog?.showModal());
	}
	function startGroup() {
		newGroup = true;
		queueMicrotask(() => groupDialog?.showModal());
	}
	const created = (close: () => void) => {
		return async ({ result, update }: { result: { type: string }; update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update();
			if (result.type === 'success') close();
		};
	};

	// --- Slepen: een budget naar een andere plek of groep, een groep naar een andere plek ---
	type Drop = { id: number; mode: 'before' | 'after' | 'inside' };
	let drag = $state<{ id: number; group: boolean; tree: string; name: string; x: number; y: number; drop: Drop | null } | null>(null);
	let placeForm = $state<HTMLFormElement>();
	let place = $state({ id: 0, parent_id: 0, before_id: '' });

	const parentOf = $derived(
		new Map<number, number>([
			...data.groups.flatMap((g) => g.budgets.map((b) => [b.id, g.id] as [number, number])),
			...data.income.map((b) => [b.id, data.roots.inkomsten] as [number, number]),
			...data.groups.map((g) => [g.id, data.roots.uitgaven] as [number, number])
		])
	);
	const siblingsOf = (parent: number) =>
		parent === data.roots.uitgaven
			? data.groups.map((g) => g.id)
			: parent === data.roots.inkomsten
				? data.income.map((b) => b.id)
				: (data.groups.find((g) => g.id === parent)?.budgets.map((b) => b.id) ?? []);

	function startDrag(e: PointerEvent, item: { id: number; name: string }, group: boolean, tree: string) {
		e.preventDefault();
		drag = { id: item.id, group, tree, name: item.name, x: e.clientX, y: e.clientY, drop: null };
	}

	function moveDrag(e: PointerEvent) {
		if (!drag) return;
		drag.x = e.clientX;
		drag.y = e.clientY;
		// Vlak bij de rand van het venster scrollt de pagina mee.
		if (e.clientY < 70) window.scrollBy(0, -14);
		else if (e.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
		const under = document.elementFromPoint(e.clientX, e.clientY);
		drag.drop = null;
		if (drag.group) {
			// Een groep: vóór of na een andere groep.
			const card = under?.closest<HTMLElement>('[data-group]');
			const id = Number(card?.dataset.group);
			if (!card || id === drag.id) return;
			const r = card.getBoundingClientRect();
			drag.drop = { id, mode: e.clientY < r.top + r.height / 2 ? 'before' : 'after' };
			return;
		}
		// Een budget: vóór of na een ander budget, of onderaan in een groep.
		const row = under?.closest<HTMLElement>('[data-budget]');
		if (row && row.dataset.tree === drag.tree) {
			const id = Number(row.dataset.budget);
			if (id === drag.id) return;
			const r = row.getBoundingClientRect();
			drag.drop = { id, mode: e.clientY < r.top + r.height / 2 ? 'before' : 'after' };
			return;
		}
		const card = under?.closest<HTMLElement>('[data-group]');
		if (card && drag.tree === 'uitgaven') drag.drop = { id: Number(card.dataset.group), mode: 'inside' };
	}

	function endDrag() {
		if (!drag) return;
		const { id, group, drop } = drag;
		drag = null;
		if (!drop) return;
		let parent: number;
		let before: number | null = null;
		if (drop.mode === 'inside') parent = drop.id;
		else {
			parent = group ? data.roots.uitgaven : parentOf.get(drop.id)!;
			const siblings = siblingsOf(parent).filter((s) => s !== id);
			before = drop.mode === 'before' ? drop.id : (siblings[siblings.indexOf(drop.id) + 1] ?? null);
		}
		place = { id, parent_id: parent, before_id: before == null ? '' : String(before) };
		queueMicrotask(() => placeForm?.requestSubmit());
	}

	const dropAt = (id: number) => (drag?.drop?.id === id ? drag.drop.mode : null);
	const groupName = (id: number) => data.groups.find((g) => g.id === id)?.name;
</script>

<svelte:head><title>Budgetten · Stax</title></svelte:head>

{#snippet budgetRow(b: Item, tree: 'uitgaven' | 'inkomsten')}
	{@const drop = !drag?.group ? dropAt(b.id) : null}
	<li data-budget={b.id} data-tree={tree} class:moving={drag?.id === b.id} class:drop-before={drop === 'before'} class:drop-after={drop === 'after'}>
		<button type="button" class="plain grip" aria-label="{b.name} verslepen" onpointerdown={(e) => startDrag(e, b, false, tree)}><Icon name="grip" size={18} /></button>
		<a class="item" href={editHref(b.id)} data-sveltekit-noscroll data-sveltekit-replacestate>
			<span class="tegel"><Icon name={b.icon} size={17} /></span>
			<span class="name">{b.name}</span>
			{#if kindTag(b.kind)}<span class="tag small">{kindTag(b.kind)}</span>{/if}
			<Icon name="edit" size={16} />
		</a>
	</li>
{/snippet}

<div class="stack">
	<header>
		<Terugknop href="/instellingen">Instellingen</Terugknop>
		<h1>Budgetten</h1>
		<p class="muted">
			Uitgaven staan in groepen; een groep telt alleen op. Een budget kan sparen, eventueel naar een doel. Sleep om de volgorde of de groep te
			veranderen. Het bedrag per maand pas je aan in het budgetoverzicht.
		</p>
	</header>
	{#if form?.error && !newBudget && !newGroup && !data.edit}<p class="banner warn small">{form.error}</p>{/if}

	<section class="tree" class:dragging={drag}>
		<div class="section-head">
			<h2>Uitgaven</h2>
			<button type="button" class="small" onclick={startGroup}><Icon name="plus" size={16} /> Nieuwe groep</button>
		</div>
		{#each data.groups as g (g.id)}
			{@const drop = drag?.group ? dropAt(g.id) : drag && dropAt(g.id) === 'inside' ? 'inside' : null}
			<div
				class="card group"
				style={hueStyle(g.id, page.data.groupHues ?? {})}
				data-group={g.id}
				class:moving={drag?.id === g.id}
				class:drop-before={drop === 'before'}
				class:drop-after={drop === 'after'}
				class:drop-inside={drop === 'inside'}
			>
				<div class="ghead">
					<button type="button" class="plain grip" aria-label="Groep {g.name} verslepen" onpointerdown={(e) => startDrag(e, g, true, 'uitgaven')}>
						<Icon name="grip" size={18} />
					</button>
					<a class="item" href={editHref(g.id)} data-sveltekit-noscroll data-sveltekit-replacestate>
						<span class="tegel groep"><Icon name={g.icon} size={18} /></span>
						<strong class="name">{g.name}</strong>
						<span class="muted small">{g.budgets.length} {g.budgets.length === 1 ? 'budget' : 'budgetten'}</span>
						<Icon name="edit" size={16} />
					</a>
				</div>
				<ul>
					{#each g.budgets as b (b.id)}{@render budgetRow(b, 'uitgaven')}{/each}
				</ul>
				<button type="button" class="ghost add" onclick={() => startBudget('uitgaven', g.id)}><Icon name="plus" size={16} /> Budget</button>
			</div>
		{/each}
	</section>

	<section class="tree" class:dragging={drag}>
		<div class="section-head">
			<h2>Inkomsten</h2>
		</div>
		<div class="card group">
			<ul>
				{#each data.income as b (b.id)}{@render budgetRow(b, 'inkomsten')}{/each}
			</ul>
			<button type="button" class="ghost add" onclick={() => startBudget('inkomsten', data.roots.inkomsten)}><Icon name="plus" size={16} /> Budget</button>
		</div>
	</section>
</div>

<svelte:window onpointermove={moveDrag} onpointerup={endDrag} onpointercancel={() => (drag = null)} />

<form bind:this={placeForm} method="POST" action="?/plaats" hidden use:enhance={() => async ({ update }) => update({ reset: false, invalidateAll: true })}>
	<input name="id" value={place.id} />
	<input name="parent_id" value={place.parent_id} />
	<input name="before_id" value={place.before_id} />
</form>

{#if drag}
	<div class="ghost-row" style:left="{drag.x + 14}px" style:top="{drag.y - 18}px" aria-hidden="true">
		<Icon name="grip" size={16} />
		<span>{drag.name}</span>
		{#if drag.drop?.mode === 'inside'}<span class="into">→ in {groupName(drag.drop.id)}</span>{/if}
	</div>
{/if}

{#if data.edit}
	<MapEditor node={data.edit} options={data.options} onclose={closeEditor} error={form && 'error' in form ? String(form.error) : ''} />
{/if}

{#if newBudget}
	<dialog bind:this={budgetDialog} class="newmap" onclose={() => (newBudget = null)} aria-labelledby="nb-title">
		<form method="POST" action="?/nieuw" use:enhance={() => created(() => budgetDialog?.close())}>
			<h2 id="nb-title">Nieuw budget</h2>
			<input type="hidden" name="parent_id" value={newBudget.parent} />
			<input type="hidden" name="kind" value={newBudget.tree === 'uitgaven' ? newBudget.kind : ''} />
			<label class="field">
				Naam
				<!-- svelte-ignore a11y_autofocus -->
				<input name="name" required autofocus placeholder={newBudget.tree === 'uitgaven' ? 'Bijv. Huisdieren' : 'Bijv. Huurinkomsten'} />
			</label>
			{#if newBudget.tree === 'uitgaven'}
				<div class="field">
					<span>In groep</span>
					<CategoryCombo
						label="In groep"
						options={data.options}
						filter={(o) => o.tree === 'uitgaven' && o.depth === 1}
						value={newBudget.parent}
						onchange={(id) => id && newBudget && (newBudget.parent = id)}
					/>
				</div>
				<div class="field">
					<span>Opties</span>
					<KindOptions bind:kind={newBudget.kind} />
				</div>
			{/if}
			{#if form?.error}<p class="neg small">{form.error}</p>{/if}
			<div class="nm-actions">
				<button class="primary">Aanmaken</button>
				<button type="button" class="ghost" onclick={() => budgetDialog?.close()}>Annuleren</button>
			</div>
		</form>
	</dialog>
{/if}

{#if newGroup}
	<dialog bind:this={groupDialog} class="newmap" onclose={() => (newGroup = false)} aria-labelledby="ng-title">
		<form method="POST" action="?/groep" use:enhance={() => created(() => groupDialog?.close())}>
			<h2 id="ng-title">Nieuwe groep</h2>
			<label class="field">
				Naam
				<!-- svelte-ignore a11y_autofocus -->
				<input name="name" required autofocus placeholder="Bijv. Huisdieren" />
			</label>
			<p class="hint small muted">Daarna zet je er budgetten in met “Budget” onderaan de groep, of sleep je bestaande budgetten erheen.</p>
			{#if form?.error}<p class="neg small">{form.error}</p>{/if}
			<div class="nm-actions">
				<button class="primary">Aanmaken</button>
				<button type="button" class="ghost" onclick={() => groupDialog?.close()}>Annuleren</button>
			</div>
		</form>
	</dialog>
{/if}

<style>
	header p {
		margin: 6px 0 0;
	}
	.section-head button.small {
		min-height: 32px;
		padding: 0 12px;
		font-size: 13.5px;
	}
	.tree {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.group {
		position: relative;
		padding: 6px 0 8px;
		transition: box-shadow 0.15s;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li,
	.ghead {
		position: relative;
		display: flex;
		align-items: center;
	}
	li + li::before {
		content: '';
		position: absolute;
		top: 0;
		left: 78px;
		right: 16px;
		border-top: 0.5px solid var(--line);
	}
	/* Handvat om te slepen; werkt met muis en vinger. */
	.grip {
		display: grid;
		place-items: center;
		width: 28px;
		height: 40px;
		margin-left: 8px;
		color: var(--faint);
		cursor: grab;
		touch-action: none;
	}
	.grip:hover {
		color: var(--muted);
	}
	.dragging,
	.dragging .grip {
		cursor: grabbing;
		user-select: none;
	}
	.moving {
		opacity: 0.4;
	}
	.item {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 12px;
		margin-right: 8px;
		padding: 12px 12px 12px 6px;
		border-radius: 12px;
		transition: background-color 0.15s;
	}
	.item:hover {
		background: var(--surface-2);
	}
	.item > :global(svg) {
		color: var(--faint);
	}
	.ghead .item {
		padding: 12px 12px 10px 6px;
	}
	.ghead .name {
		font-size: 16.5px;
		font-weight: 650;
	}
	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.tag {
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--accent-soft);
		color: var(--accent);
		font-weight: 600;
		white-space: nowrap;
	}
	.add {
		margin: 4px 0 0 42px;
		min-height: 34px;
		padding: 0 12px;
		font-size: 13.5px;
		color: var(--accent);
	}
	/* Waar het terechtkomt: een lijn erboven of eronder, of de hele groep gemarkeerd. */
	.drop-before::after,
	.drop-after::after {
		content: '';
		position: absolute;
		left: 44px;
		right: 12px;
		height: 3px;
		border-radius: 2px;
		background: var(--accent);
		z-index: 1;
	}
	.drop-before::after {
		top: -1.5px;
	}
	.drop-after::after {
		bottom: -1.5px;
	}
	.group.drop-before::after {
		top: -9.5px;
		left: 16px;
	}
	.group.drop-after::after {
		bottom: -9.5px;
		left: 16px;
	}
	.group.drop-inside {
		box-shadow:
			var(--shadow),
			inset 0 0 0 2px var(--accent);
	}
	.ghost-row {
		position: fixed;
		z-index: 80;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		border-radius: 12px;
		background: var(--surface);
		color: var(--text);
		font-weight: 600;
		box-shadow:
			0 0 0 0.5px var(--line),
			0 14px 40px rgb(20 10 60 / 0.25);
		pointer-events: none;
	}
	.ghost-row .into {
		color: var(--accent);
		font-weight: 500;
		font-size: 13.5px;
	}
	.newmap {
		width: min(460px, calc(100vw - 32px));
		padding: 22px;
		border: 0;
		border-radius: 22px;
		background: var(--surface);
		color: var(--text);
		box-shadow: var(--float);
	}
	.newmap::backdrop {
		background: rgb(20 20 30 / 0.35);
	}
	.newmap:focus {
		outline: none;
	}
	.newmap form {
		display: flex;
		flex-direction: column;
		gap: 16px;
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
		margin: 0;
		font-weight: 400;
	}
	.nm-actions {
		display: flex;
		gap: 8px;
	}
</style>
