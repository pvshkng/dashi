<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let {
		rows,
		x,
		y,
		series,
		mode = 'vertical',
		colors,
		format,
		onSelect
	}: {
		rows: Record<string, unknown>[];
		x: string;
		y: string;
		series?: string;
		mode?: 'vertical' | 'horizontal' | 'stacked' | 'grouped';
		colors: string[];
		format?: ValueFormat;
		onSelect?: (value: string) => void;
	} = $props();

	let width = $state(400);
	let height = $state(240);

	const PAD = { top: 8, right: 8, bottom: 22, left: 48 };

	interface Segment {
		key: string;
		from: number;
		to: number;
		color: string;
	}
	interface Bar {
		category: string;
		segments: Segment[];
	}

	let hasSeries = $derived(Boolean(series) && (mode === 'stacked' || mode === 'grouped'));
	let seriesKeys = $derived(
		hasSeries ? [...new Set(rows.map((row) => String(row[series!] ?? '')))] : []
	);

	let bars = $derived.by<Bar[]>(() => {
		const byCategory = new SvelteMap<string, Map<string, number>>();
		for (const row of rows) {
			const category = String(row[x] ?? '');
			const key = hasSeries ? String(row[series!] ?? '') : '';
			const value = toNumber(row[y]) ?? 0;
			if (!byCategory.has(category)) byCategory.set(category, new SvelteMap());
			const inner = byCategory.get(category)!;
			inner.set(key, (inner.get(key) ?? 0) + value);
		}
		return [...byCategory.entries()].map(([category, values]) => {
			if (!hasSeries) {
				const value = values.get('') ?? 0;
				return { category, segments: [{ key: '', from: 0, to: value, color: colors[0] }] };
			}
			if (mode === 'stacked') {
				let acc = 0;
				const segments = seriesKeys.map((key, i) => {
					const value = values.get(key) ?? 0;
					const segment = { key, from: acc, to: acc + value, color: colors[i % colors.length] };
					acc += value;
					return segment;
				});
				return { category, segments };
			}
			return {
				category,
				segments: seriesKeys.map((key, i) => ({
					key,
					from: 0,
					to: values.get(key) ?? 0,
					color: colors[i % colors.length]
				}))
			};
		});
	});

	let maxValue = $derived(
		Math.max(1e-9, ...bars.flatMap((bar) => bar.segments.map((segment) => segment.to)))
	);

	let plotW = $derived(Math.max(10, width - PAD.left - PAD.right));
	let plotH = $derived(Math.max(10, height - PAD.top - PAD.bottom));
	let horizontal = $derived(mode === 'horizontal');
	let ticks = $derived([0, 0.25, 0.5, 0.75, 1].map((t) => t * maxValue));
	let labelEvery = $derived(Math.max(1, Math.ceil(bars.length / (horizontal ? 40 : 12))));

	function scale(value: number): number {
		return (value / maxValue) * (horizontal ? plotW : plotH);
	}
</script>

<div class="h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="img">
		{#each ticks as tick (tick)}
			{#if horizontal}
				<line
					x1={PAD.left + scale(tick)}
					x2={PAD.left + scale(tick)}
					y1={PAD.top}
					y2={PAD.top + plotH}
					stroke="currentColor"
					opacity="0.08"
				/>
				<text
					x={PAD.left + scale(tick)}
					y={height - 6}
					text-anchor="middle"
					class="fill-current text-[9px] opacity-50"
				>
					{formatValue(tick, format)}
				</text>
			{:else}
				<line
					x1={PAD.left}
					x2={PAD.left + plotW}
					y1={PAD.top + plotH - scale(tick)}
					y2={PAD.top + plotH - scale(tick)}
					stroke="currentColor"
					opacity="0.08"
				/>
				<text
					x={PAD.left - 4}
					y={PAD.top + plotH - scale(tick) + 3}
					text-anchor="end"
					class="fill-current text-[9px] opacity-50"
				>
					{formatValue(tick, format)}
				</text>
			{/if}
		{/each}
		{#each bars as bar, barIndex (bar.category)}
			{@const slot = (horizontal ? plotH : plotW) / Math.max(1, bars.length)}
			{@const groupCount = mode === 'grouped' ? Math.max(1, bar.segments.length) : 1}
			{@const barSize = (slot * 0.72) / groupCount}
			{#each bar.segments as segment, segmentIndex (segment.key)}
				{@const offset =
					slot * barIndex + slot * 0.14 + (mode === 'grouped' ? segmentIndex * barSize : 0)}
				{#if horizontal}
					<rect
						x={PAD.left + scale(segment.from)}
						y={PAD.top + offset}
						width={Math.max(0, scale(segment.to) - scale(segment.from))}
						height={Math.max(1, barSize)}
						fill={segment.color}
						rx="1.5"
						class={onSelect ? 'cursor-pointer hover:opacity-70' : ''}
						role="presentation"
						onclick={() => onSelect?.(bar.category)}
					>
						<title>
							{bar.category}{segment.key ? ` · ${segment.key}` : ''}: {formatValue(
								segment.to - segment.from,
								format
							)}
						</title>
					</rect>
				{:else}
					<rect
						x={PAD.left + offset}
						y={PAD.top + plotH - scale(segment.to)}
						width={Math.max(1, barSize)}
						height={Math.max(0, scale(segment.to) - scale(segment.from))}
						fill={segment.color}
						rx="1.5"
						class={onSelect ? 'cursor-pointer hover:opacity-70' : ''}
						role="presentation"
						onclick={() => onSelect?.(bar.category)}
					>
						<title>
							{bar.category}{segment.key ? ` · ${segment.key}` : ''}: {formatValue(
								segment.to - segment.from,
								format
							)}
						</title>
					</rect>
				{/if}
			{/each}
			{#if barIndex % labelEvery === 0}
				{#if horizontal}
					<text
						x={PAD.left - 4}
						y={PAD.top + slot * barIndex + slot / 2 + 3}
						text-anchor="end"
						class="fill-current text-[9px] opacity-60"
					>
						{bar.category.length > 8 ? `${bar.category.slice(0, 8)}…` : bar.category}
					</text>
				{:else}
					<text
						x={PAD.left + (plotW / Math.max(1, bars.length)) * (barIndex + 0.5)}
						y={height - 6}
						text-anchor="middle"
						class="fill-current text-[9px] opacity-60"
					>
						{bar.category.length > 10 ? `${bar.category.slice(0, 10)}…` : bar.category}
					</text>
				{/if}
			{/if}
		{/each}
	</svg>
	{#if hasSeries && seriesKeys.length > 1}
		<div class="pointer-events-none -mt-1 flex flex-wrap gap-2 px-2 text-[10px]">
			{#each seriesKeys as key, i (key)}
				<span class="inline-flex items-center gap-1 opacity-70">
					<span
						class="inline-block size-2 rounded-sm"
						style={`background:${colors[i % colors.length]}`}
					></span>
					{key}
				</span>
			{/each}
		</div>
	{/if}
</div>
