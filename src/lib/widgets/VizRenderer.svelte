<script lang="ts">
	import ChartRenderer from '$lib/charts/ChartRenderer.svelte';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import MetricRenderer from '$lib/charts/MetricRenderer.svelte';
	import PivotTableRenderer from '$lib/charts/PivotTableRenderer.svelte';
	import type { NodeResult } from '$lib/workflow/engine';
	import type {
		ChartNodeConfig,
		GridNodeConfig,
		MetricNodeConfig,
		PivotTableNodeConfig,
		WorkflowNode
	} from '$lib/workflow/types';

	let {
		node,
		result,
		onSelect
	}: {
		node: WorkflowNode;
		result: NodeResult;
		onSelect?: (column: string, value: string) => void;
	} = $props();
</script>

{#if result.error}
	<p class="text-destructive p-2 text-sm">{result.error}</p>
{:else if node.kind === 'chart'}
	<ChartRenderer rows={result.rows} config={node.config as ChartNodeConfig} {onSelect} />
{:else if node.kind === 'grid'}
	{@const config = node.config as GridNodeConfig}
	<TableRenderer
		columns={result.columns}
		rows={result.rows}
		pageSize={config.pageSize}
		format={config.format}
		exportable
		exportName={node.label}
		onCellClick={onSelect}
	/>
{:else if node.kind === 'metric'}
	<MetricRenderer rows={result.rows} config={node.config as MetricNodeConfig} title={node.label} />
{:else if node.kind === 'pivottable'}
	<PivotTableRenderer rows={result.rows} config={node.config as PivotTableNodeConfig} />
{:else}
	<p class="text-muted-foreground p-2 text-sm">Not a visualization node.</p>
{/if}
