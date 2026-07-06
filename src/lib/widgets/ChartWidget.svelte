<script lang="ts">
	import { LineChart, BarChart, AreaChart, ScatterChart, PieChart } from 'layerchart';
	import type { ChartWidget } from './types';
	import type { DataConnection } from '$lib/connections/types';
	import { executeQuery } from '$lib/query/executeQuery';
	import { getColorScheme } from '$lib/charts/theme';

	let { widget, connection }: { widget: ChartWidget; connection: DataConnection | undefined } =
		$props();

	let rows = $state<Record<string, unknown>[]>([]);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!connection) return;
		executeQuery(connection, widget.config.dataSource.sql)
			.then((result) => {
				rows = result.rows;
				error = null;
			})
			.catch((err: unknown) => {
				error = err instanceof Error ? err.message : 'query failed';
			});
	});

	let scheme = $derived(getColorScheme(widget.config.colorScheme));
</script>

<div class="lc-root-container h-full w-full" style={`--color-primary: ${scheme.primary}`}>
	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{:else if !connection}
		<p class="text-muted-foreground text-sm">No connection selected.</p>
	{:else if widget.config.chartType === 'line'}
		<LineChart
			data={rows}
			x={widget.config.x}
			y={widget.config.y}
			series={widget.config.series
				? [
						{
							key: widget.config.series,
							value: (d: Record<string, unknown>) => d[widget.config.series ?? '']
						}
					]
				: undefined}
		/>
	{:else if widget.config.chartType === 'bar'}
		<BarChart data={rows} x={widget.config.x} y={widget.config.y} />
	{:else if widget.config.chartType === 'area'}
		<AreaChart data={rows} x={widget.config.x} y={widget.config.y} />
	{:else if widget.config.chartType === 'scatter'}
		<ScatterChart data={rows} x={widget.config.x} y={widget.config.y} />
	{:else if widget.config.chartType === 'pie'}
		<PieChart data={rows} key={widget.config.x} value={widget.config.y} />
	{/if}
</div>
