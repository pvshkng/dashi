<script lang="ts">
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let {
		rows,
		x,
		y,
		colors,
		format
	}: {
		rows: Record<string, unknown>[];
		x: string;
		y: string;
		colors: string[];
		format?: ValueFormat;
	} = $props();

	let width = $state(400);
	let height = $state(240);

	const PAD = { top: 8, right: 8, bottom: 22, left: 48 };

	interface Step {
		label: string;
		from: number;
		to: number;
		kind: 'up' | 'down' | 'total';
	}

	let steps = $derived.by<Step[]>(() => {
		let acc = 0;
		const list: Step[] = rows.map((row) => {
			const delta = toNumber(row[y]) ?? 0;
			const from = acc;
			acc += delta;
			return {
				label: String(row[x] ?? ''),
				from,
				to: acc,
				kind: delta >= 0 ? ('up' as const) : ('down' as const)
			};
		});
		list.push({ label: 'Total', from: 0, to: acc, kind: 'total' });
		return list;
	});

	let low = $derived(Math.min(0, ...steps.flatMap((step) => [step.from, step.to])));
	let high = $derived(Math.max(1e-9, ...steps.flatMap((step) => [step.from, step.to])));
	let plotW = $derived(Math.max(10, width - PAD.left - PAD.right));
	let plotH = $derived(Math.max(10, height - PAD.top - PAD.bottom));
	let labelEvery = $derived(Math.max(1, Math.ceil(steps.length / 12)));

	function toY(value: number): number {
		return PAD.top + plotH - ((value - low) / (high - low)) * plotH;
	}

	function fill(kind: Step['kind']): string {
		if (kind === 'total') return 'oklch(0.55 0 0)';
		if (kind === 'down') return colors[1] ?? 'oklch(0.6 0.2 25)';
		return colors[0];
	}
</script>

<div class="h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="img">
		<line
			x1={PAD.left}
			x2={PAD.left + plotW}
			y1={toY(0)}
			y2={toY(0)}
			stroke="currentColor"
			opacity="0.2"
		/>
		{#each steps as step, i (i)}
			{@const slot = plotW / steps.length}
			{@const top = Math.min(toY(step.from), toY(step.to))}
			{@const h = Math.max(1, Math.abs(toY(step.from) - toY(step.to)))}
			<rect
				x={PAD.left + slot * i + slot * 0.15}
				y={top}
				width={slot * 0.7}
				height={h}
				rx="1.5"
				fill={fill(step.kind)}
			>
				<title>{step.label}: {formatValue(step.to - step.from, format)}</title>
			</rect>
			{#if i < steps.length - 1}
				<line
					x1={PAD.left + slot * i + slot * 0.85}
					x2={PAD.left + slot * (i + 1) + slot * 0.15}
					y1={toY(step.to)}
					y2={toY(step.to)}
					stroke="currentColor"
					opacity="0.3"
					stroke-dasharray="2 2"
				/>
			{/if}
			{#if i % labelEvery === 0}
				<text
					x={PAD.left + slot * (i + 0.5)}
					y={height - 6}
					text-anchor="middle"
					class="fill-current text-[9px] opacity-60"
				>
					{step.label.length > 9 ? `${step.label.slice(0, 9)}…` : step.label}
				</text>
			{/if}
		{/each}
		{#each [low, (low + high) / 2, high] as tick (tick)}
			<text
				x={PAD.left - 4}
				y={toY(tick) + 3}
				text-anchor="end"
				class="fill-current text-[9px] opacity-50"
			>
				{formatValue(tick, format)}
			</text>
		{/each}
	</svg>
</div>
