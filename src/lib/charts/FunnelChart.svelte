<script lang="ts">
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let {
		rows,
		x,
		y,
		colors,
		format,
		onSelect
	}: {
		rows: Record<string, unknown>[];
		x: string;
		y: string;
		colors: string[];
		format?: ValueFormat;
		onSelect?: (value: string) => void;
	} = $props();

	let width = $state(400);
	let height = $state(240);

	let stages = $derived(
		rows
			.map((row) => ({ label: String(row[x] ?? ''), value: toNumber(row[y]) ?? 0 }))
			.toSorted((a, b) => b.value - a.value)
	);
	let maxValue = $derived(Math.max(1e-9, ...stages.map((stage) => stage.value)));
	let rowH = $derived(height / Math.max(1, stages.length));
</script>

<div class="h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="img">
		{#each stages as stage, i (stage.label)}
			{@const w = Math.max(4, (stage.value / maxValue) * (width * 0.6))}
			<rect
				x={(width - w) / 2}
				y={i * rowH + rowH * 0.08}
				width={w}
				height={rowH * 0.84}
				rx="3"
				fill={colors[i % colors.length]}
				class={onSelect ? 'cursor-pointer hover:opacity-70' : ''}
				role="presentation"
				onclick={() => onSelect?.(stage.label)}
			>
				<title>
					{stage.label}: {formatValue(stage.value, format)} ({(
						(stage.value / maxValue) *
						100
					).toFixed(1)}%)
				</title>
			</rect>
			<text
				x={8}
				y={i * rowH + rowH / 2 + 3}
				class="pointer-events-none fill-current text-[10px] opacity-70"
			>
				{stage.label.length > 14 ? `${stage.label.slice(0, 14)}…` : stage.label}
			</text>
			<text
				x={width - 8}
				y={i * rowH + rowH / 2 + 3}
				text-anchor="end"
				class="pointer-events-none fill-current text-[10px] font-medium"
			>
				{formatValue(stage.value, format)}
			</text>
		{/each}
	</svg>
</div>
