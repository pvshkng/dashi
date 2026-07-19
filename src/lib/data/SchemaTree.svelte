<script lang="ts">
	import type { DataConnection } from '$lib/connections/types';
	import { listColumns, listTables, type ColumnInfo } from '$lib/query/schema';
	import { runQuery } from '$lib/duckdb/client';
	import CaretRightIcon from 'phosphor-svelte/lib/CaretRight';
	import TableIcon from 'phosphor-svelte/lib/Table';
	import ArrowClockwiseIcon from 'phosphor-svelte/lib/ArrowClockwise';

	let {
		connection,
		onPickTable
	}: {
		connection: DataConnection | 'local';
		onPickTable: (table: string) => void;
	} = $props();

	let tables = $state<string[]>([]);
	let columns = $state<Record<string, ColumnInfo[]>>({});
	let expanded = $state<Record<string, boolean>>({});
	let error = $state<string | null>(null);
	let loading = $state(false);

	async function refresh() {
		loading = true;
		error = null;
		expanded = {};
		columns = {};
		try {
			if (connection === 'local') {
				const rows = await runQuery('show tables');
				tables = rows.map((row) => String(row.name));
			} else {
				tables = await listTables(connection);
			}
		} catch (err) {
			tables = [];
			error = err instanceof Error ? err.message : 'Failed to list tables.';
		} finally {
			loading = false;
		}
	}

	async function toggle(table: string) {
		expanded[table] = !expanded[table];
		if (expanded[table] && !columns[table]) {
			try {
				if (connection === 'local') {
					const rows = await runQuery(`describe "${table.replaceAll('"', '""')}"`);
					columns[table] = rows.map((row) => ({
						name: String(row.column_name),
						type: String(row.column_type)
					}));
				} else {
					columns[table] = await listColumns(connection, table);
				}
			} catch {
				columns[table] = [];
			}
		}
	}

	$effect(() => {
		void connection;
		refresh();
	});
</script>

<div class="flex min-h-0 flex-1 flex-col gap-1 overflow-auto">
	<div
		class="text-muted-foreground flex items-center justify-between px-1 text-[10px] font-semibold tracking-wide uppercase"
	>
		Tables
		<button type="button" class="hover:text-foreground p-1" title="Refresh" onclick={refresh}>
			<ArrowClockwiseIcon size={12} />
		</button>
	</div>
	{#if error}
		<p class="text-destructive px-1 text-xs">{error}</p>
	{:else if loading}
		<p class="text-muted-foreground px-1 text-xs">Loading…</p>
	{/if}
	{#each tables as table (table)}
		<div>
			<div class="hover:bg-accent flex w-full items-center rounded-md">
				<button
					type="button"
					class="p-1"
					aria-label={expanded[table] ? 'Collapse columns' : 'Expand columns'}
					onclick={() => toggle(table)}
				>
					<CaretRightIcon
						size={10}
						class={`transition-transform ${expanded[table] ? 'rotate-90' : ''}`}
					/>
				</button>
				<button
					type="button"
					class="flex min-w-0 flex-1 items-center gap-1.5 py-1 pr-1 text-left text-xs"
					title="Insert select statement"
					ondblclick={() => onPickTable(table)}
					onclick={() => toggle(table)}
				>
					<TableIcon size={12} class="text-muted-foreground shrink-0" />
					<span class="truncate">{table}</span>
				</button>
			</div>
			{#if expanded[table]}
				<div class="ml-5 border-l pl-2">
					{#each columns[table] ?? [] as column (column.name)}
						<div class="flex items-center justify-between gap-2 py-0.5 text-[11px]">
							<span class="truncate">{column.name}</span>
							<span class="text-muted-foreground shrink-0 font-mono text-[10px]">
								{column.type.toLowerCase()}
							</span>
						</div>
					{:else}
						<p class="text-muted-foreground py-0.5 text-[10px]">No columns.</p>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		{#if !loading && !error}
			<p class="text-muted-foreground px-1 text-xs">No tables.</p>
		{/if}
	{/each}
</div>
