<script lang="ts">
	import { LineChart, BarChart, AreaChart, ScatterChart, PieChart } from 'layerchart';
	import type { ChartNodeConfig } from '$lib/workflow/types';
	import { getColorScheme } from './theme';

	let { rows, config }: { rows: Record<string, unknown>[]; config: ChartNodeConfig } = $props();

	let scheme = $derived(getColorScheme(config.colorScheme));
	let ready = $derived(Boolean(config.x && config.y));
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
</script>

<div class="h-full w-full" style={paletteStyle}>
	{#if !ready}
		<p class="text-muted-foreground p-2 text-sm">Pick X and Y columns.</p>
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
		<BarChart data={rows} x={config.x} y={config.y} />
	{:else if config.chartType === 'area'}
		<AreaChart data={rows} x={config.x} y={config.y} />
	{:else if config.chartType === 'scatter'}
		<ScatterChart data={rows} x={config.x} y={config.y} />
	{:else if config.chartType === 'pie'}
		<PieChart data={rows} key={config.x} value={config.y} />
	{/if}
</div>
