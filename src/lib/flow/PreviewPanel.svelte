<script lang="ts">
	import type {
		ChartNodeConfig,
		ChartType,
		FilterOp,
		GridNodeConfig,
		MetricNodeConfig,
		Workflow,
		WorkflowNode
	} from '$lib/workflow/types';
	import { isVizKind, getNodeDef } from '$lib/workflow/defs';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import ChartRenderer from '$lib/charts/ChartRenderer.svelte';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import MetricRenderer from '$lib/charts/MetricRenderer.svelte';
	import { colorSchemes } from '$lib/charts/theme';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import XIcon from 'phosphor-svelte/lib/X';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import FunnelIcon from 'phosphor-svelte/lib/Funnel';

	let {
		workflow,
		onConfigChange,
		onAddToDashboard,
		onClose
	}: {
		workflow: Workflow;
		onConfigChange: (nodeId: string, config: WorkflowNode['config']) => void;
		onAddToDashboard: (node: WorkflowNode) => void;
		onClose: () => void;
	} = $props();

	const chartTypes: ChartType[] = ['line', 'bar', 'area', 'scatter', 'pie'];
	const filterOps: { value: FilterOp; label: string }[] = [
		{ value: 'eq', label: '=' },
		{ value: 'neq', label: '≠' },
		{ value: 'gt', label: '>' },
		{ value: 'gte', label: '≥' },
		{ value: 'lt', label: '<' },
		{ value: 'lte', label: '≤' },
		{ value: 'contains', label: 'contains' }
	];

	let width = $state(380);
	let selectedId = $state<string | null>(null);
	let filterOpen = $state(false);
	let filterColumn = $state('');
	let filterOp = $state<FilterOp>('eq');
	let filterValue = $state('');

	let outputs = $derived(workflow.nodes.filter((node) => isVizKind(node.kind)));
	let node = $derived(outputs.find((n) => n.id === selectedId) ?? outputs[0]);
	let runState = $derived(workflowRuntime.get(workflow.id));
	let running = $derived(runState?.status === 'running');
	let result = $derived(node ? runState?.run?.results?.[node.id] : undefined);

	let filteredRows = $derived.by(() => {
		const rows = result?.rows ?? [];
		if (!filterOpen || !filterColumn || (!filterValue && filterOp !== 'eq')) return rows;
		if (!filterValue) return rows;
		return rows.filter((row) => matches(row[filterColumn]));
	});

	function matches(cell: unknown): boolean {
		const text = cell == null ? '' : String(cell);
		const asNumber = Number(cell);
		const wanted = Number(filterValue);
		const numeric = !Number.isNaN(asNumber) && !Number.isNaN(wanted);
		switch (filterOp) {
			case 'eq':
				return numeric ? asNumber === wanted : text === filterValue;
			case 'neq':
				return numeric ? asNumber !== wanted : text !== filterValue;
			case 'gt':
				return numeric && asNumber > wanted;
			case 'gte':
				return numeric && asNumber >= wanted;
			case 'lt':
				return numeric && asNumber < wanted;
			case 'lte':
				return numeric && asNumber <= wanted;
			case 'contains':
				return text.toLowerCase().includes(filterValue.toLowerCase());
			default:
				return true;
		}
	}

	function patchChart(partial: Partial<ChartNodeConfig>) {
		if (!node || node.kind !== 'chart') return;
		onConfigChange(node.id, { ...(node.config as ChartNodeConfig), ...partial });
	}

	function patchMetric(partial: Partial<MetricNodeConfig>) {
		if (!node || node.kind !== 'metric') return;
		onConfigChange(node.id, { ...(node.config as MetricNodeConfig), ...partial });
	}

	function startResize(event: PointerEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const origin = width;
		function onMove(moveEvent: PointerEvent) {
			width = Math.max(300, Math.min(720, origin + (startX - moveEvent.clientX)));
		}
		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		}
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	let chartConfig = $derived(node?.kind === 'chart' ? (node.config as ChartNodeConfig) : null);
	let columns = $derived(result?.columns ?? []);
</script>

<aside class="bg-background relative flex shrink-0 flex-col border-l" style={`width: ${width}px;`}>
	<button
		type="button"
		class="hover:bg-primary/30 absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize transition-colors"
		aria-label="Resize preview"
		onpointerdown={startResize}
	></button>

	<header class="flex shrink-0 items-center gap-1.5 border-b px-2 py-1.5">
		<span class="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
			Preview
		</span>
		{#if outputs.length > 1 && node}
			<Select.Root type="single" value={node.id} onValueChange={(value) => (selectedId = value)}>
				<Select.Trigger class="h-6 w-40 text-xs">{node.label}</Select.Trigger>
				<Select.Content>
					{#each outputs as output (output.id)}
						<Select.Item value={output.id} label={output.label}>
							{output.label}
							<span class="text-muted-foreground ml-1 text-[10px]">
								{getNodeDef(output.kind).label}
							</span>
						</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		{:else if node}
			<span class="truncate text-xs font-medium">{node.label}</span>
		{/if}
		<div class="ml-auto flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				title="Filter rows"
				onclick={() => (filterOpen = !filterOpen)}
			>
				<FunnelIcon size={13} weight={filterOpen ? 'fill' : 'regular'} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class="size-6"
				title="Run workflow"
				disabled={running}
				onclick={() => workflowRuntime.run(workflow)}
			>
				{#if running}
					<CircleNotchIcon size={13} class="animate-spin" />
				{:else}
					<PlayIcon size={13} />
				{/if}
			</Button>
			<Button variant="ghost" size="icon" class="size-6" title="Close preview" onclick={onClose}>
				<XIcon size={13} />
			</Button>
		</div>
	</header>

	{#if node && chartConfig}
		<div class="grid shrink-0 grid-cols-2 gap-1.5 border-b p-2">
			<Select.Root
				type="single"
				value={chartConfig.chartType}
				onValueChange={(value) => patchChart({ chartType: value as ChartType })}
			>
				<Select.Trigger class="h-7 text-xs">{chartConfig.chartType}</Select.Trigger>
				<Select.Content>
					{#each chartTypes as type (type)}
						<Select.Item value={type} label={type} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				type="single"
				value={chartConfig.colorScheme}
				onValueChange={(value) => patchChart({ colorScheme: value })}
			>
				<Select.Trigger class="h-7 text-xs">
					{colorSchemes.find((s) => s.id === chartConfig?.colorScheme)?.name ?? 'Colors'}
				</Select.Trigger>
				<Select.Content>
					{#each colorSchemes as scheme (scheme.id)}
						<Select.Item value={scheme.id} label={scheme.name} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				type="single"
				value={chartConfig.x}
				onValueChange={(value) => patchChart({ x: value })}
			>
				<Select.Trigger class="h-7 text-xs">X · {chartConfig.x || 'pick'}</Select.Trigger>
				<Select.Content>
					{#each columns as column (column)}
						<Select.Item value={column} label={column} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				type="single"
				value={chartConfig.y}
				onValueChange={(value) => patchChart({ y: value })}
			>
				<Select.Trigger class="h-7 text-xs">Y · {chartConfig.y || 'pick'}</Select.Trigger>
				<Select.Content>
					{#each columns as column (column)}
						<Select.Item value={column} label={column} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root
				type="single"
				value={chartConfig.series ?? ''}
				onValueChange={(value) => patchChart({ series: value || undefined })}
			>
				<Select.Trigger class="col-span-2 h-7 text-xs">
					Series · {chartConfig.series ?? 'none'}
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="" label="No series" />
					{#each columns as column (column)}
						<Select.Item value={column} label={column} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{:else if node?.kind === 'metric'}
		<div class="shrink-0 border-b p-2">
			<Select.Root
				type="single"
				value={(node.config as MetricNodeConfig).column}
				onValueChange={(value) => patchMetric({ column: value })}
			>
				<Select.Trigger class="h-7 w-full text-xs">
					Column · {(node.config as MetricNodeConfig).column || 'pick'}
				</Select.Trigger>
				<Select.Content>
					{#each columns as column (column)}
						<Select.Item value={column} label={column} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	{#if filterOpen}
		<div class="flex shrink-0 items-center gap-1.5 border-b p-2">
			<Select.Root type="single" value={filterColumn} onValueChange={(v) => (filterColumn = v)}>
				<Select.Trigger class="h-7 flex-1 text-xs">{filterColumn || 'Column'}</Select.Trigger>
				<Select.Content>
					{#each columns as column (column)}
						<Select.Item value={column} label={column} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Select.Root type="single" value={filterOp} onValueChange={(v) => (filterOp = v as FilterOp)}>
				<Select.Trigger class="h-7 w-16 text-xs">
					{filterOps.find((op) => op.value === filterOp)?.label}
				</Select.Trigger>
				<Select.Content>
					{#each filterOps as op (op.value)}
						<Select.Item value={op.value} label={op.label} />
					{/each}
				</Select.Content>
			</Select.Root>
			<Input bind:value={filterValue} placeholder="Value" class="h-7 flex-1 text-xs" />
		</div>
	{/if}

	<div class="min-h-0 flex-1 overflow-hidden p-2">
		{#if !node}
			<p class="text-muted-foreground p-2 text-sm">
				Add a chart, table view or metric node to preview it here.
			</p>
		{:else if !result}
			<div
				class="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-sm"
			>
				<p>Run the workflow to preview “{node.label}”.</p>
				<Button
					size="sm"
					class="h-7 text-xs"
					disabled={running}
					onclick={() => workflowRuntime.run(workflow)}
				>
					<PlayIcon size={13} />
					Run now
				</Button>
			</div>
		{:else if result.error}
			<p class="text-destructive p-2 text-sm">{result.error}</p>
		{:else if node.kind === 'chart'}
			<ChartRenderer rows={filteredRows} config={node.config as ChartNodeConfig} />
		{:else if node.kind === 'grid'}
			<TableRenderer
				columns={result.columns}
				rows={filteredRows}
				pageSize={(node.config as GridNodeConfig).pageSize}
			/>
		{:else if node.kind === 'metric'}
			<MetricRenderer rows={filteredRows} config={node.config as MetricNodeConfig} />
		{/if}
	</div>

	{#if node && result && !result.error}
		<footer class="flex shrink-0 items-center gap-2 border-t px-3 py-1.5">
			<span class="text-muted-foreground text-[10px]">
				{filteredRows.length.toLocaleString()} of {result.rowCount.toLocaleString()} rows
			</span>
			<Button
				variant="outline"
				size="sm"
				class="ml-auto h-6 gap-1 text-[11px]"
				onclick={() => node && onAddToDashboard(node)}
			>
				<SquaresFourIcon size={12} />
				Add to dashboard
			</Button>
		</footer>
	{/if}
</aside>
