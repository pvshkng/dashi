<script lang="ts">
	import { LineChart, BarChart, AreaChart, ScatterChart, PieChart } from 'layerchart';
	import type { ChartNodeConfig } from '$lib/workflow/types';
	import { getColorScheme } from './theme';
	import { toNumber } from './format';
	import CategoricalBars from './CategoricalBars.svelte';
	import HeatmapChart from './HeatmapChart.svelte';
	import FunnelChart from './FunnelChart.svelte';
	import WaterfallChart from './WaterfallChart.svelte';
	import GaugeChart from './GaugeChart.svelte';
	import TreemapChart from './TreemapChart.svelte';

	let {
		rows,
		config,
		onSelect
	}: {
		rows: Record<string, unknown>[];
		config: ChartNodeConfig;
		onSelect?: (column: string, value: string) => void;
	} = $props();

	let scheme = $derived(getColorScheme(config.colorScheme));
	let ready = $derived(
		config.chartType === 'gauge' ? Boolean(config.y) : Boolean(config.x && (config.y || config.chartType === 'histogram'))
	);
	let paletteStyle = $derived(
		[
			`--dash-chart-primary: ${scheme.primary}`,
			scheme.colors[1] && `--color-secondary: ${scheme.colors[1]}`,
			scheme.colors[2] && `--color-info: ${scheme.colors[2]}`,
			scheme.colors[3] && `--color-success: ${scheme.colors[3]}`,
			scheme.colors[4] && `--color-warning: ${scheme.colors[4]}`
		]
			.filter(Boolean)
			.join('; ')
	);

	let selectX = $derived(onSelect ? (value: string) => onSelect(config.x, value) : undefined);

	/** Equal-width buckets over the numeric values of the x column. */
	let histogramRows = $derived.by(() => {
		if (config.chartType !== 'histogram') return [];
		const values = rows
			.map((row) => toNumber(row[config.x]))
			.filter((value): value is number => value !== null);
		if (values.length === 0) return [];
		const bins = Math.max(2, Math.floor(config.bins ?? 20));
		const lo = Math.min(...values);
		const hi = Math.max(...values);
		const span = hi - lo || 1;
		const counts = new Array(bins).fill(0) as number[];
		for (const value of values) {
			const index = Math.min(bins - 1, Math.floor(((value - lo) / span) * bins));
			counts[index] += 1;
		}
		const digits = span / bins >= 10 ? 0 : 2;
		return counts.map((count, i) => ({
			bucket: `${(lo + (span / bins) * i).toFixed(digits)}–${(lo + (span / bins) * (i + 1)).toFixed(digits)}`,
			count
		}));
	});
</script>

<div class="h-full w-full" style={paletteStyle}>
	{#if !ready}
		<p class="text-muted-foreground p-2 text-sm">Pick chart columns.</p>
	{:else if config.chartType === 'line'}
		<LineChart
			data={rows}
			x={config.x}
			y={config.y}
			series={config.series
				? [{ key: config.series, value: (d: Record<string, unknown>) => d[config.series ?? ''] }]
				: undefined}
		/>
	{:else if config.chartType === 'bar'}
		<CategoricalBars
			{rows}
			x={config.x}
			y={config.y}
			mode="vertical"
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{:else if config.chartType === 'horizontal-bar'}
		<CategoricalBars
			{rows}
			x={config.x}
			y={config.y}
			mode="horizontal"
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{:else if config.chartType === 'stacked-bar'}
		<CategoricalBars
			{rows}
			x={config.x}
			y={config.y}
			series={config.series}
			mode="stacked"
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{:else if config.chartType === 'grouped-bar'}
		<CategoricalBars
			{rows}
			x={config.x}
			y={config.y}
			series={config.series}
			mode="grouped"
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{:else if config.chartType === 'area'}
		<AreaChart data={rows} x={config.x} y={config.y} />
	{:else if config.chartType === 'scatter'}
		<ScatterChart data={rows} x={config.x} y={config.y} />
	{:else if config.chartType === 'pie'}
		<PieChart data={rows} key={config.x} value={config.y} />
	{:else if config.chartType === 'donut'}
		<PieChart data={rows} key={config.x} value={config.y} innerRadius={-0.6} />
	{:else if config.chartType === 'histogram'}
		<CategoricalBars
			rows={histogramRows}
			x="bucket"
			y="count"
			mode="vertical"
			colors={scheme.colors}
		/>
	{:else if config.chartType === 'heatmap'}
		{#if config.series}
			<HeatmapChart
				{rows}
				x={config.x}
				y={config.y}
				value={config.series}
				color={scheme.primary}
				format={config.format}
				onSelect={onSelect ? (xv) => onSelect(config.x, xv) : undefined}
			/>
		{:else}
			<p class="text-muted-foreground p-2 text-sm">Pick a value column.</p>
		{/if}
	{:else if config.chartType === 'funnel'}
		<FunnelChart
			{rows}
			x={config.x}
			y={config.y}
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{:else if config.chartType === 'waterfall'}
		<WaterfallChart {rows} x={config.x} y={config.y} colors={scheme.colors} format={config.format} />
	{:else if config.chartType === 'gauge'}
		<GaugeChart {rows} y={config.y} max={config.max} color={scheme.primary} format={config.format} />
	{:else if config.chartType === 'treemap'}
		<TreemapChart
			{rows}
			x={config.x}
			y={config.y}
			colors={scheme.colors}
			format={config.format}
			onSelect={selectX}
		/>
	{/if}
</div>
