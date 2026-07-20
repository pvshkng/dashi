<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import { runQueryWithColumns } from '$lib/duckdb/client';
	import { viewName, type NodeResult } from '$lib/workflow/engine';
	import { dashboardFilters } from '$lib/dashboard/filters.svelte';
	import VizRenderer from './VizRenderer.svelte';
	import type { VizWidget } from './types';
	import type { ChartNodeConfig, WorkflowNode } from '$lib/workflow/types';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRight';

	let { widget }: { widget: VizWidget } = $props();

	let workflow = $derived(workspaceStore.workflowById(widget.config.workflowId));
	let node = $derived(workflow?.nodes.find((n) => n.id === widget.config.nodeId));
	let runState = $derived(workflow ? workflowRuntime.get(workflow.id) : undefined);
	let result = $derived(runState?.run?.results[widget.config.nodeId]);

	let chartConfig = $derived(node?.kind === 'chart' ? (node.config as ChartNodeConfig) : undefined);
	let drillDims = $derived(chartConfig?.drillDimensions ?? []);
	let drilling = $derived(drillDims.length > 0);
	let drillPath = $state<{ column: string; value: string }[]>([]);
	let upstreamId = $derived(
		workflow?.edges.find((edge) => edge.target === widget.config.nodeId)?.source
	);

	$effect(() => {
		if (workflow && node) {
			void workflow.updatedAt;
			workflowRuntime.ensure(workflow);
		}
	});

	$effect(() => {
		const seconds = widget.config.refreshSec;
		const target = workflow;
		if (!seconds || seconds < 1 || !target) return;
		const timer = setInterval(() => {
			workflowRuntime.invalidate(target.id);
			workflowRuntime.ensure(target);
		}, seconds * 1000);
		return () => clearInterval(timer);
	});

	function qi(identifier: string): string {
		return `"${identifier.replaceAll('"', '""')}"`;
	}

	function literal(value: string): string {
		if (/^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
		return `'${value.replaceAll("'", "''")}'`;
	}

	// Filtered/drilled view of the base result, recomputed when selections change.
	let override = $state<{ result: NodeResult; node?: WorkflowNode } | null>(null);
	let computeToken = 0;

	$effect(() => {
		const base = result;
		const currentNode = node;
		const currentWorkflow = workflow;
		const filters = dashboardFilters.filters;
		const path = drillPath.map((step) => ({ ...step }));
		void filters;
		if (!base || base.error || !currentNode || !currentWorkflow) {
			override = null;
			return;
		}
		const token = ++computeToken;
		void (async () => {
			try {
				if (drilling && upstreamId && chartConfig) {
					const upstream = runState?.run?.results[upstreamId];
					const level = Math.min(path.length, drillDims.length - 1);
					const dim = drillDims[level];
					const yColumn = chartConfig.y;
					if (!upstream || !yColumn) {
						if (token === computeToken) override = null;
						return;
					}
					const clauses = path.map(
						(step) => `${qi(step.column)}::varchar = ${literal(step.value)}::varchar`
					);
					const external = dashboardFilters.whereClause(upstream.columns, widget.id);
					if (external) clauses.push(external);
					const where = clauses.length > 0 ? ` where ${clauses.join(' and ')}` : '';
					const sql = `select ${qi(dim)}, sum(${qi(yColumn)}) as ${qi(yColumn)} from ${viewName(currentWorkflow.id, upstreamId)}${where} group by 1 order by 1 limit 1000`;
					const data = await runQueryWithColumns(sql);
					if (token !== computeToken) return;
					override = {
						result: { columns: data.columns, rows: data.rows, rowCount: data.rows.length },
						node: {
							...currentNode,
							config: { ...chartConfig, x: dim }
						} as WorkflowNode
					};
					return;
				}
				const where = dashboardFilters.whereClause(base.columns, widget.id);
				if (!where) {
					if (token === computeToken) override = null;
					return;
				}
				const sql = `select * from ${viewName(currentWorkflow.id, currentNode.id)} where ${where} limit 1000`;
				const data = await runQueryWithColumns(sql);
				if (token !== computeToken) return;
				override = {
					result: { columns: data.columns, rows: data.rows, rowCount: data.rows.length }
				};
			} catch {
				if (token === computeToken) override = null;
			}
		})();
	});

	function onSelect(column: string, value: string) {
		if (drilling) {
			if (drillPath.length < drillDims.length - 1) {
				drillPath = [...drillPath, { column, value }];
			}
			return;
		}
		dashboardFilters.toggle({
			id: `sel:${widget.id}:${column}`,
			column,
			op: 'eq',
			value,
			sourceWidgetId: widget.id
		});
	}

	let shownResult = $derived(override?.result ?? result);
	let shownNode = $derived(override?.node ?? node);
</script>

{#if !workflow || !node}
	<p class="text-muted-foreground p-2 text-sm">The workflow behind this widget was removed.</p>
{:else if runState?.status === 'running' && !result}
	<div class="text-muted-foreground flex h-full items-center justify-center">
		<CircleNotchIcon size={18} class="animate-spin" />
	</div>
{:else if runState?.run?.error}
	<p class="text-destructive p-2 text-sm">{runState.run.error}</p>
{:else if shownResult && shownNode}
	<div class="flex h-full w-full flex-col">
		{#if drillPath.length > 0}
			<div class="text-muted-foreground flex flex-wrap items-center gap-0.5 px-1 pb-1 text-[10px]">
				<button type="button" class="hover:text-foreground" onclick={() => (drillPath = [])}>
					All
				</button>
				{#each drillPath as step, i (i)}
					<CaretRightIcon size={9} />
					<button
						type="button"
						class="hover:text-foreground font-medium"
						onclick={() => (drillPath = drillPath.slice(0, i + 1))}
					>
						{step.value}
					</button>
				{/each}
			</div>
		{/if}
		<div class="min-h-0 flex-1">
			<VizRenderer node={shownNode} result={shownResult} {onSelect} />
		</div>
	</div>
{:else}
	<p class="text-muted-foreground p-2 text-sm">No data yet — run the workflow.</p>
{/if}
