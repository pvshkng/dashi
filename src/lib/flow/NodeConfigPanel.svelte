<script lang="ts">
	import type {
		AggregateFn,
		AggregateNodeConfig,
		ChartNodeConfig,
		FilterNodeConfig,
		FilterOp,
		FormulaNodeConfig,
		GridNodeConfig,
		JoinNodeConfig,
		LimitNodeConfig,
		MetricNodeConfig,
		SelectNodeConfig,
		SortNodeConfig,
		SqlNodeConfig,
		TableNodeConfig,
		UnionNodeConfig,
		Workflow,
		WorkflowNode
	} from '$lib/workflow/types';
	import { getNodeDef, isVizKind } from '$lib/workflow/defs';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { isLocalConnection } from '$lib/connections/types';
	import { listTables } from '$lib/query/schema';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import { colorSchemes } from '$lib/charts/theme';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Separator } from '$lib/components/ui/separator';
	import * as Select from '$lib/components/ui/select';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import XIcon from 'phosphor-svelte/lib/X';

	let {
		workflow,
		node,
		onConfigChange,
		onLabelChange,
		onDelete,
		onAddToDashboard,
		onClose
	}: {
		workflow: Workflow;
		node: WorkflowNode;
		onConfigChange: (config: WorkflowNode['config']) => void;
		onLabelChange: (label: string) => void;
		onDelete: () => void;
		onAddToDashboard: () => void;
		onClose: () => void;
	} = $props();

	const filterOps: { value: FilterOp; label: string }[] = [
		{ value: 'eq', label: '=' },
		{ value: 'neq', label: '≠' },
		{ value: 'gt', label: '>' },
		{ value: 'gte', label: '≥' },
		{ value: 'lt', label: '<' },
		{ value: 'lte', label: '≤' },
		{ value: 'contains', label: 'contains' },
		{ value: 'is_null', label: 'is null' },
		{ value: 'not_null', label: 'is not null' }
	];
	const aggregateFns: AggregateFn[] = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max'];
	const chartTypes = ['line', 'bar', 'area', 'scatter', 'pie'] as const;
	const joinTypes = ['inner', 'left', 'right', 'full'] as const;

	let def = $derived(getNodeDef(node.kind));
	let runState = $derived(workflowRuntime.get(workflow.id));
	let results = $derived(runState?.run?.results ?? {});
	let result = $derived(results[node.id]);

	function upstreamColumns(handle?: string): string[] {
		const edge = workflow.edges.find(
			(e) => e.target === node.id && (handle === undefined || (e.targetHandle ?? 'in') === handle)
		);
		if (!edge) return [];
		return results[edge.source]?.columns ?? [];
	}

	let inputColumns = $derived(upstreamColumns());
	let ownColumns = $derived(result?.columns ?? []);

	function patch(partial: Record<string, unknown>) {
		onConfigChange({ ...node.config, ...partial } as WorkflowNode['config']);
	}

	let serverTablesPromise = $derived.by(() => {
		if (node.kind !== 'table') return null;
		const config = node.config as TableNodeConfig;
		const connection = connectionsStore.connections.find((c) => c.id === config.connectionId);
		if (!connection || isLocalConnection(connection)) return null;
		return listTables(connection).catch(() => [] as string[]);
	});
</script>

{#snippet columnSelect(
	value: string,
	columns: string[],
	onchange: (column: string) => void,
	placeholder = 'Column'
)}
	<Select.Root type="single" {value} onValueChange={onchange}>
		<Select.Trigger class="h-8 w-full text-xs">{value || placeholder}</Select.Trigger>
		<Select.Content>
			{#each columns as column (column)}
				<Select.Item value={column} label={column} />
			{/each}
		</Select.Content>
	</Select.Root>
{/snippet}

<aside class="bg-background/80 flex h-full w-80 shrink-0 flex-col border-l backdrop-blur-xl">
	<header class="flex items-center justify-between gap-2 border-b px-3 py-2">
		<p class="text-sm font-medium">{def.label}</p>
		<Button variant="ghost" size="icon" class="size-6" title="Close" onclick={onClose}>
			<XIcon size={14} />
		</Button>
	</header>

	<div class="min-h-0 flex-1 space-y-4 overflow-auto p-3">
		<div class="space-y-1">
			<Label class="text-xs">Name</Label>
			<Input
				value={node.label}
				class="h-8 text-xs"
				oninput={(event) => onLabelChange((event.target as HTMLInputElement).value)}
			/>
		</div>

		{#if node.kind === 'table'}
			{@const config = node.config as TableNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Connection</Label>
				<Select.Root
					type="single"
					value={config.connectionId}
					onValueChange={(value) => {
						const connection = connectionsStore.connections.find((c) => c.id === value);
						patch({
							connectionId: value,
							tableName: connection && isLocalConnection(connection) ? connection.tableName : ''
						});
					}}
				>
					<Select.Trigger class="h-8 w-full text-xs">
						{connectionsStore.connections.find((c) => c.id === config.connectionId)?.name ??
							'Pick a connection'}
					</Select.Trigger>
					<Select.Content>
						{#each connectionsStore.connections as connection (connection.id)}
							<Select.Item value={connection.id} label={connection.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Table</Label>
				{#if serverTablesPromise}
					{#await serverTablesPromise}
						<p class="text-muted-foreground text-xs">Loading tables…</p>
					{:then serverTables}
						{#if serverTables.length > 0}
							{@render columnSelect(
								config.tableName,
								serverTables,
								(table) => patch({ tableName: table }),
								'Pick a table'
							)}
						{:else}
							<Input
								value={config.tableName}
								class="h-8 font-mono text-xs"
								placeholder="table name"
								oninput={(event) => patch({ tableName: (event.target as HTMLInputElement).value })}
							/>
						{/if}
					{/await}
				{:else}
					<Input
						value={config.tableName}
						class="h-8 font-mono text-xs"
						placeholder="table name"
						oninput={(event) => patch({ tableName: (event.target as HTMLInputElement).value })}
					/>
				{/if}
			</div>
		{:else if node.kind === 'sql'}
			{@const config = node.config as SqlNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Connection</Label>
				<Select.Root
					type="single"
					value={config.connectionId}
					onValueChange={(value) => patch({ connectionId: value })}
				>
					<Select.Trigger class="h-8 w-full text-xs">
						{config.connectionId === ''
							? 'Local DuckDB'
							: (connectionsStore.connections.find((c) => c.id === config.connectionId)?.name ??
								'Pick a connection')}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Local DuckDB" />
						{#each connectionsStore.connections as connection (connection.id)}
							<Select.Item value={connection.id} label={connection.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">SQL</Label>
				<Textarea
					value={config.sql}
					rows={6}
					class="font-mono text-xs"
					onchange={(event) => patch({ sql: (event.target as HTMLTextAreaElement).value })}
				/>
				<p class="text-muted-foreground text-[10px]">
					Server connections run remotely, then results are cached locally for transforms.
				</p>
			</div>
		{:else if node.kind === 'filter'}
			{@const config = node.config as FilterNodeConfig}
			<div class="flex items-center justify-between">
				<Label class="text-xs">Match</Label>
				<Select.Root
					type="single"
					value={config.combinator}
					onValueChange={(value) => patch({ combinator: value })}
				>
					<Select.Trigger class="h-7 w-24 text-xs">
						{config.combinator === 'and' ? 'All (and)' : 'Any (or)'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="and" label="All (and)" />
						<Select.Item value="or" label="Any (or)" />
					</Select.Content>
				</Select.Root>
			</div>
			{#each config.conditions as condition, index (index)}
				<div class="space-y-1 rounded-lg border p-2">
					<div class="flex items-center gap-1">
						{@render columnSelect(condition.column, inputColumns, (column) => {
							const conditions = [...config.conditions];
							conditions[index] = { ...condition, column };
							patch({ conditions });
						})}
						<Button
							variant="ghost"
							size="icon"
							class="size-7 shrink-0"
							onclick={() => patch({ conditions: config.conditions.filter((_, i) => i !== index) })}
						>
							<TrashIcon size={12} />
						</Button>
					</div>
					<div class="flex items-center gap-1">
						<Select.Root
							type="single"
							value={condition.op}
							onValueChange={(value) => {
								const conditions = [...config.conditions];
								conditions[index] = { ...condition, op: value as FilterOp };
								patch({ conditions });
							}}
						>
							<Select.Trigger class="h-8 w-28 text-xs">
								{filterOps.find((op) => op.value === condition.op)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each filterOps as op (op.value)}
									<Select.Item value={op.value} label={op.label} />
								{/each}
							</Select.Content>
						</Select.Root>
						{#if condition.op !== 'is_null' && condition.op !== 'not_null'}
							<Input
								value={condition.value}
								class="h-8 flex-1 text-xs"
								placeholder="value"
								onchange={(event) => {
									const conditions = [...config.conditions];
									conditions[index] = {
										...condition,
										value: (event.target as HTMLInputElement).value
									};
									patch({ conditions });
								}}
							/>
						{/if}
					</div>
				</div>
			{/each}
			<Button
				variant="outline"
				size="sm"
				class="w-full text-xs"
				onclick={() =>
					patch({
						conditions: [...config.conditions, { column: '', op: 'eq', value: '' }]
					})}
			>
				<PlusIcon size={12} />
				Add condition
			</Button>
		{:else if node.kind === 'select'}
			{@const config = node.config as SelectNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Columns to keep</Label>
				<p class="text-muted-foreground text-[10px]">Nothing checked keeps every column.</p>
				<div class="space-y-1 rounded-lg border p-2">
					{#each inputColumns as column (column)}
						<label class="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								checked={config.columns.includes(column)}
								onchange={(event) => {
									const checked = (event.target as HTMLInputElement).checked;
									patch({
										columns: checked
											? [...config.columns, column]
											: config.columns.filter((c) => c !== column)
									});
								}}
							/>
							{column}
						</label>
					{:else}
						<p class="text-muted-foreground text-[10px]">Connect and run to see columns.</p>
					{/each}
				</div>
			</div>
		{:else if node.kind === 'formula'}
			{@const config = node.config as FormulaNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">New column name</Label>
				<Input
					value={config.alias}
					class="h-8 font-mono text-xs"
					onchange={(event) => patch({ alias: (event.target as HTMLInputElement).value })}
				/>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">SQL expression</Label>
				<Textarea
					value={config.expression}
					rows={3}
					class="font-mono text-xs"
					placeholder="revenue / units"
					onchange={(event) => patch({ expression: (event.target as HTMLTextAreaElement).value })}
				/>
			</div>
		{:else if node.kind === 'aggregate'}
			{@const config = node.config as AggregateNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Group by</Label>
				<div class="space-y-1 rounded-lg border p-2">
					{#each inputColumns as column (column)}
						<label class="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								checked={config.groupBy.includes(column)}
								onchange={(event) => {
									const checked = (event.target as HTMLInputElement).checked;
									patch({
										groupBy: checked
											? [...config.groupBy, column]
											: config.groupBy.filter((c) => c !== column)
									});
								}}
							/>
							{column}
						</label>
					{:else}
						<p class="text-muted-foreground text-[10px]">Connect and run to see columns.</p>
					{/each}
				</div>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Aggregations</Label>
				{#each config.aggregates as aggregate, index (index)}
					<div class="space-y-1 rounded-lg border p-2">
						<div class="flex items-center gap-1">
							<Select.Root
								type="single"
								value={aggregate.fn}
								onValueChange={(value) => {
									const aggregates = [...config.aggregates];
									aggregates[index] = { ...aggregate, fn: value as AggregateFn };
									patch({ aggregates });
								}}
							>
								<Select.Trigger class="h-8 w-32 text-xs">{aggregate.fn}</Select.Trigger>
								<Select.Content>
									{#each aggregateFns as fn (fn)}
										<Select.Item value={fn} label={fn} />
									{/each}
								</Select.Content>
							</Select.Root>
							{@render columnSelect(
								aggregate.column,
								aggregate.fn === 'count' ? ['*', ...inputColumns] : inputColumns,
								(column) => {
									const aggregates = [...config.aggregates];
									aggregates[index] = { ...aggregate, column };
									patch({ aggregates });
								}
							)}
						</div>
						<div class="flex items-center gap-1">
							<Input
								value={aggregate.alias}
								class="h-8 flex-1 text-xs"
								placeholder="alias"
								onchange={(event) => {
									const aggregates = [...config.aggregates];
									aggregates[index] = {
										...aggregate,
										alias: (event.target as HTMLInputElement).value
									};
									patch({ aggregates });
								}}
							/>
							<Button
								variant="ghost"
								size="icon"
								class="size-7 shrink-0"
								onclick={() =>
									patch({ aggregates: config.aggregates.filter((_, i) => i !== index) })}
							>
								<TrashIcon size={12} />
							</Button>
						</div>
					</div>
				{/each}
				<Button
					variant="outline"
					size="sm"
					class="w-full text-xs"
					onclick={() =>
						patch({
							aggregates: [...config.aggregates, { fn: 'sum', column: '', alias: '' }]
						})}
				>
					<PlusIcon size={12} />
					Add aggregation
				</Button>
			</div>
		{:else if node.kind === 'join'}
			{@const config = node.config as JoinNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Join type</Label>
				<Select.Root
					type="single"
					value={config.joinType}
					onValueChange={(value) => patch({ joinType: value })}
				>
					<Select.Trigger class="h-8 w-full text-xs">{config.joinType}</Select.Trigger>
					<Select.Content>
						{#each joinTypes as type (type)}
							<Select.Item value={type} label={type} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Left key</Label>
				{@render columnSelect(config.leftKey, upstreamColumns('left'), (column) =>
					patch({ leftKey: column })
				)}
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Right key</Label>
				{@render columnSelect(config.rightKey, upstreamColumns('right'), (column) =>
					patch({ rightKey: column })
				)}
			</div>
		{:else if node.kind === 'union'}
			{@const config = node.config as UnionNodeConfig}
			<div class="flex items-center justify-between gap-2">
				<Label for="union-all" class="text-xs">Keep duplicate rows (union all)</Label>
				<Switch
					id="union-all"
					checked={config.all}
					onCheckedChange={(checked) => patch({ all: checked })}
				/>
			</div>
		{:else if node.kind === 'sort'}
			{@const config = node.config as SortNodeConfig}
			{#each config.keys as key, index (index)}
				<div class="flex items-center gap-1">
					{@render columnSelect(key.column, inputColumns, (column) => {
						const keys = [...config.keys];
						keys[index] = { ...key, column };
						patch({ keys });
					})}
					<Select.Root
						type="single"
						value={key.dir}
						onValueChange={(value) => {
							const keys = [...config.keys];
							keys[index] = { ...key, dir: value as 'asc' | 'desc' };
							patch({ keys });
						}}
					>
						<Select.Trigger class="h-8 w-20 text-xs">{key.dir}</Select.Trigger>
						<Select.Content>
							<Select.Item value="asc" label="asc" />
							<Select.Item value="desc" label="desc" />
						</Select.Content>
					</Select.Root>
					<Button
						variant="ghost"
						size="icon"
						class="size-7 shrink-0"
						onclick={() => patch({ keys: config.keys.filter((_, i) => i !== index) })}
					>
						<TrashIcon size={12} />
					</Button>
				</div>
			{/each}
			<Button
				variant="outline"
				size="sm"
				class="w-full text-xs"
				onclick={() => patch({ keys: [...config.keys, { column: '', dir: 'asc' }] })}
			>
				<PlusIcon size={12} />
				Add sort key
			</Button>
		{:else if node.kind === 'limit'}
			{@const config = node.config as LimitNodeConfig}
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1">
					<Label class="text-xs">Rows</Label>
					<Input
						type="number"
						value={config.count}
						class="h-8 text-xs"
						onchange={(event) =>
							patch({ count: Number((event.target as HTMLInputElement).value) || 0 })}
					/>
				</div>
				<div class="space-y-1">
					<Label class="text-xs">Offset</Label>
					<Input
						type="number"
						value={config.offset}
						class="h-8 text-xs"
						onchange={(event) =>
							patch({ offset: Number((event.target as HTMLInputElement).value) || 0 })}
					/>
				</div>
			</div>
		{:else if node.kind === 'chart'}
			{@const config = node.config as ChartNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Chart type</Label>
				<Select.Root
					type="single"
					value={config.chartType}
					onValueChange={(value) => patch({ chartType: value })}
				>
					<Select.Trigger class="h-8 w-full text-xs">{config.chartType}</Select.Trigger>
					<Select.Content>
						{#each chartTypes as type (type)}
							<Select.Item value={type} label={type} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">{config.chartType === 'pie' ? 'Category' : 'X axis'}</Label>
				{@render columnSelect(config.x, inputColumns, (column) => patch({ x: column }))}
			</div>
			<div class="space-y-1">
				<Label class="text-xs">{config.chartType === 'pie' ? 'Value' : 'Y axis'}</Label>
				{@render columnSelect(config.y, inputColumns, (column) => patch({ y: column }))}
			</div>
			{#if config.chartType === 'line'}
				<div class="space-y-1">
					<Label class="text-xs">Series (optional)</Label>
					{@render columnSelect(config.series ?? '', inputColumns, (column) =>
						patch({ series: column || undefined })
					)}
				</div>
			{/if}
			<div class="space-y-1">
				<Label class="text-xs">Colors</Label>
				<Select.Root
					type="single"
					value={config.colorScheme}
					onValueChange={(value) => patch({ colorScheme: value })}
				>
					<Select.Trigger class="h-8 w-full text-xs">
						{colorSchemes.find((s) => s.id === config.colorScheme)?.name ?? 'Colors'}
					</Select.Trigger>
					<Select.Content>
						{#each colorSchemes as scheme (scheme.id)}
							<Select.Item value={scheme.id} label={scheme.name} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		{:else if node.kind === 'grid'}
			{@const config = node.config as GridNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Rows per page</Label>
				<Input
					type="number"
					value={config.pageSize}
					class="h-8 text-xs"
					onchange={(event) =>
						patch({ pageSize: Number((event.target as HTMLInputElement).value) || 50 })}
				/>
			</div>
		{:else if node.kind === 'metric'}
			{@const config = node.config as MetricNodeConfig}
			<div class="space-y-1">
				<Label class="text-xs">Value column</Label>
				{@render columnSelect(config.column, inputColumns, (column) => patch({ column }))}
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Label</Label>
				<Input
					value={config.label}
					class="h-8 text-xs"
					onchange={(event) => patch({ label: (event.target as HTMLInputElement).value })}
				/>
			</div>
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1">
					<Label class="text-xs">Prefix</Label>
					<Input
						value={config.prefix ?? ''}
						class="h-8 text-xs"
						placeholder="$"
						onchange={(event) =>
							patch({ prefix: (event.target as HTMLInputElement).value || undefined })}
					/>
				</div>
				<div class="space-y-1">
					<Label class="text-xs">Suffix</Label>
					<Input
						value={config.suffix ?? ''}
						class="h-8 text-xs"
						placeholder="%"
						onchange={(event) =>
							patch({ suffix: (event.target as HTMLInputElement).value || undefined })}
					/>
				</div>
			</div>
		{/if}

		{#if result && !result.error && ownColumns.length > 0}
			<Separator />
			<div class="space-y-1">
				<Label class="text-xs">
					Preview · {result.rowCount.toLocaleString()} rows
				</Label>
				<div class="h-56 overflow-hidden rounded-lg border text-xs">
					<TableRenderer columns={ownColumns} rows={result.rows.slice(0, 100)} pageSize={20} />
				</div>
			</div>
		{:else if result?.error}
			<Separator />
			<p class="text-destructive text-xs">{result.error}</p>
		{/if}
	</div>

	<footer class="flex items-center gap-2 border-t p-3">
		{#if isVizKind(node.kind)}
			<Button size="sm" class="flex-1 text-xs" onclick={onAddToDashboard}>
				<SquaresFourIcon size={14} />
				Add to dashboard
			</Button>
		{/if}
		<Button variant="outline" size="sm" class="text-destructive text-xs" onclick={onDelete}>
			<TrashIcon size={14} />
			Delete
		</Button>
	</footer>
</aside>
