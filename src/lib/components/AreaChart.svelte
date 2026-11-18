<script lang="ts">
	// Eén reeks per maand: als lijn met vlakvulling (een stand) of als kolommen (een bedrag per maand),
	// optioneel met een referentielijn zoals het budget. Kruisdraad en tooltip bij aanwijzen.
	let {
		points,
		format,
		label,
		mode = 'area',
		reference = null
	}: {
		/** target: per punt een streepje, bijvoorbeeld het budget van die maand. */
		points: { label: string; value: number; target?: number | null }[];
		format: (v: number) => string;
		label: string;
		mode?: 'area' | 'columns';
		reference?: { value: number; label: string } | null;
	} = $props();

	let width = $state(600);
	const height = 220;
	const pad = { top: 16, right: 16, bottom: 28, left: 56 };

	function niceTicks(min: number, max: number, count = 4): number[] {
		// Bij (bijna) vlakke data toch een leesbare schaal van minstens € 100.
		if (max - min < 10_000) max = min + 10_000;
		const raw = (max - min) / count;
		const mag = 10 ** Math.floor(Math.log10(raw));
		const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
		const ticks: number[] = [];
		for (let v = Math.floor(min / step) * step; v <= max + step * 0.001; v += step) ticks.push(Math.round(v));
		return ticks;
	}

	const values = $derived([...points.flatMap((p) => [p.value, p.target ?? 0]), ...(reference ? [reference.value] : [])]);
	const ticks = $derived(niceTicks(Math.min(0, ...values), Math.max(0, ...values)));
	const yMin = $derived(ticks[0]);
	const yMax = $derived(ticks.at(-1)!);
	const innerW = $derived(Math.max(10, width - pad.left - pad.right));
	const innerH = height - pad.top - pad.bottom;
	// Kolommen staan midden in hun vak; een lijn loopt van rand tot rand.
	const slot = $derived(innerW / Math.max(1, points.length));
	const x = (i: number) =>
		mode === 'columns' ? pad.left + slot * (i + 0.5) : pad.left + (points.length < 2 ? innerW / 2 : (i / (points.length - 1)) * innerW);
	const y = (v: number) => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;
	const barW = $derived(Math.min(56, slot * 0.72));

	const line = $derived(points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(''));
	const area = $derived(points.length ? `${line}L${x(points.length - 1)},${y(Math.max(yMin, 0))}L${x(0)},${y(Math.max(yMin, 0))}Z` : '');
	// Niet elk maandlabel past; toon er zo veel als er ruimte is.
	const every = $derived(Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70)))));

	/** Kolom met afgeronde bovenkant (4px) en rechte voet op de nullijn. */
	function column(i: number, v: number) {
		const x0 = x(i) - barW / 2;
		const base = y(0);
		const top = y(v);
		const h = Math.abs(base - top);
		const r = Math.min(8, h, barW / 2);
		if (v >= 0) return `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${base}Z`;
		return `M${x0},${base}V${top - r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top - r}V${base}Z`;
	}

	let hover = $state<number | null>(null);
	function move(e: PointerEvent) {
		const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
		const px = e.clientX - rect.left - pad.left;
		if (mode === 'columns') hover = Math.max(0, Math.min(points.length - 1, Math.floor(px / slot)));
		else hover = points.length < 2 ? 0 : Math.max(0, Math.min(points.length - 1, Math.round((px / innerW) * (points.length - 1))));
	}

	const compact = (v: number) => (Math.abs(v) >= 10_000 ? `${Math.round(v / 1000)}K` : `${v}`);
</script>

<div class="chart" bind:clientWidth={width}>
	<svg {width} {height} role="img" aria-label={label} onpointermove={move} onpointerdown={move} onpointerleave={() => (hover = null)}>
		{#each ticks as t}
			<line class="grid" x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} />
			<text class="axis" x={pad.left - 10} y={y(t)} text-anchor="end" dominant-baseline="middle">{compact(Math.round(t / 100))}</text>
		{/each}
		{#each points as p, i}
			{#if i % every === 0 || i === points.length - 1}
				<text class="axis" x={x(i)} y={height - 8} text-anchor="middle">{p.label}</text>
			{/if}
		{/each}

		{#if mode === 'columns'}
			{#if hover !== null}<rect class="hoverband" x={pad.left + slot * hover} y={pad.top} width={slot} height={innerH} rx="6" />{/if}
			{#each points as p, i}
				{#if p.value !== 0}<path class="col" class:last={i === points.length - 1} class:over={p.target != null && p.value > p.target} d={column(i, p.value)} />{/if}
				{#if p.target}<line class="target" x1={x(i) - barW / 2 - 4} x2={x(i) + barW / 2 + 4} y1={y(p.target)} y2={y(p.target)} />{/if}
			{/each}
		{:else}
			<path class="area" d={area} />
			<path class="line" d={line} />
			{#if points.length}
				{@const last = points.length - 1}
				<circle class="dot" cx={x(last)} cy={y(points[last].value)} r="4.5" />
			{/if}
			{#if hover !== null}
				<line class="cross" x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} />
				<circle class="dot" cx={x(hover)} cy={y(points[hover].value)} r="5" />
			{/if}
		{/if}

		{#if reference}
			<line class="ref" x1={pad.left} x2={width - pad.right} y1={y(reference.value)} y2={y(reference.value)} />
			<text class="reflabel" x={width - pad.right} y={y(reference.value) - 6} text-anchor="end">{reference.label}</text>
		{/if}
		<rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="transparent" />
	</svg>
	{#if hover !== null}
		<div class="tip" style:left="{x(hover)}px" style:top="{y(Math.max(points[hover].value, 0))}px" class:flip={x(hover) > width - 160}>
			<span class="muted">{points[hover].label}</span>
			<strong class="num">{format(points[hover].value)}</strong>
			{#if points[hover].target}<span class="muted small">budget {format(points[hover].target!)}</span>{/if}
			{#if reference}<span class="muted small">{reference.label}: {format(reference.value)}</span>{/if}
		</div>
	{/if}
</div>

<style>
	.chart {
		position: relative;
		width: 100%;
		touch-action: pan-y;
	}
	svg {
		display: block;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
		stroke-width: 1;
	}
	.axis {
		fill: var(--muted);
		font-size: 11.5px;
		font-variant-numeric: tabular-nums;
	}
	.area {
		fill: var(--chart);
		opacity: 0.1;
	}
	.line {
		fill: none;
		stroke: var(--chart);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.col {
		fill: var(--accent-soft);
	}
	.col.last {
		fill: var(--accent);
	}
	.col.over {
		fill: var(--neg);
	}
	.target {
		stroke: var(--text);
		stroke-width: 2;
		stroke-linecap: round;
		opacity: 0.55;
	}
	.hoverband {
		fill: var(--fill);
	}
	.dot {
		fill: var(--chart);
		stroke: var(--surface);
		stroke-width: 2;
	}
	.cross {
		stroke: var(--faint);
		stroke-width: 1;
	}
	.ref {
		stroke: var(--text);
		stroke-width: 1;
		opacity: 0.45;
	}
	.reflabel {
		fill: var(--muted);
		font-size: 11.5px;
	}
	.tip {
		position: absolute;
		transform: translate(14px, -50%);
		display: flex;
		flex-direction: column;
		padding: 7px 11px;
		border-radius: 10px;
		background: var(--surface);
		box-shadow: var(--float);
		font-size: 13px;
		pointer-events: none;
		white-space: nowrap;
	}
	.tip.flip {
		transform: translate(calc(-100% - 14px), -50%);
	}
</style>
