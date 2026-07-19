<script lang="ts">
	import ChartRenderer from '$lib/charts/ChartRenderer.svelte';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import MetricRenderer from '$lib/charts/MetricRenderer.svelte';
	import type { NodeResult } from '$lib/workflow/engine';
	import type {
		ChartNodeConfig,
		GridNodeConfig,
		MetricNodeConfig,
		WorkflowNode
	} from '$lib/workflow/types';

	let { node, result }: { node: WorkflowNode; result: NodeResult } = $props();
</script>

{#if result.error}
	<p class="text-destructive p-2 text-sm">{result.error}</p>
{:else if node.kind === 'chart'}
	<ChartRenderer rows={result.rows} config={node.config as ChartNodeConfig} />
{:else if node.kind === 'grid'}
	<TableRenderer
		columns={result.columns}
		rows={result.rows}
		pageSize={(node.config as GridNodeConfig).pageSize}
	/>
{:else if node.kind === 'metric'}
	<MetricRenderer rows={result.rows} config={node.config as MetricNodeConfig} />
{:else}
	<p class="text-muted-foreground p-2 text-sm">Not a visualization node.</p>
{/if}
