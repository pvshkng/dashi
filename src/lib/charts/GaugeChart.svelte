<script lang="ts">
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let {
		rows,
		y,
		max,
		color,
		format
	}: {
		rows: Record<string, unknown>[];
		y: string;
		max?: number;
		color: string;
		format?: ValueFormat;
	} = $props();

	let width = $state(300);
	let height = $state(200);

	let value = $derived(toNumber(rows[0]?.[y]) ?? 0);
	let scaleMax = $derived(max && max > 0 ? max : Math.max(1e-9, value) * 1.25);
	let ratio = $derived(Math.max(0, Math.min(1, value / scaleMax)));

	let radius = $derived(Math.min(width / 2 - 10, height - 30));
	let cx = $derived(width / 2);
	let cy = $derived(height / 2 + radius / 2);

	function arcPath(fraction: number): string {
		const start = Math.PI;
		const end = Math.PI + Math.PI * fraction;
		const x1 = cx + radius * Math.cos(start);
		const y1 = cy + radius * Math.sin(start);
		const x2 = cx + radius * Math.cos(end);
		const y2 = cy + radius * Math.sin(end);
		const large = fraction > 0.5 ? 1 : 0;
		return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
	}
</script>

<div class="h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="img">
		{#if radius > 12}
			<path
				d={arcPath(1)}
				fill="none"
				stroke="currentColor"
				opacity="0.12"
				stroke-width={Math.max(6, radius / 6)}
				stroke-linecap="round"
			/>
			{#if ratio > 0.005}
				<path
					d={arcPath(ratio)}
					fill="none"
					stroke={color}
					stroke-width={Math.max(6, radius / 6)}
					stroke-linecap="round"
				>
					<title>{formatValue(value, format)} of {formatValue(scaleMax, format)}</title>
				</path>
			{/if}
			<text
				x={cx}
				y={cy - radius / 4}
				text-anchor="middle"
				class="fill-current text-2xl font-semibold tabular-nums"
			>
				{formatValue(value, format)}
			</text>
			<text x={cx} y={cy} text-anchor="middle" class="fill-current text-[10px] opacity-50">
				of {formatValue(scaleMax, format)}
			</text>
		{/if}
	</svg>
</div>
