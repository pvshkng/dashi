<script lang="ts">
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { isFileConnection, type DataConnection } from '$lib/connections/types';
	import { executeQuery } from '$lib/query/executeQuery';
	import { runQueryWithColumns } from '$lib/duckdb/client';
	import { runQuery } from '$lib/duckdb/client';
	import { listTables } from '$lib/query/schema';
	import { windowManager } from '$lib/windows/manager.svelte';
	import SqlEditor from '$lib/data/SqlEditor.svelte';
	import SchemaTree from '$lib/data/SchemaTree.svelte';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import * as Resizable from '$lib/components/ui/resizable';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { Kbd } from '$lib/components/ui/kbd';
	import { cn } from '$lib/utils';
	import { get, set } from 'idb-keyval';
	import { onMount } from 'svelte';
	import type { SQLNamespace } from '@codemirror/lang-sql';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import PlugsIcon from 'phosphor-svelte/lib/Plugs';
	import ClockCounterClockwiseIcon from 'phosphor-svelte/lib/ClockCounterClockwise';
	import DatabaseIcon from 'phosphor-svelte/lib/Database';
	import HardDrivesIcon from 'phosphor-svelte/lib/HardDrives';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';

	const HISTORY_KEY = 'data:sql-history';

	interface HistoryEntry {
		sql: string;
		target: string;
		at: number;
	}

	let target = $state<string>('local');
	let sqlText = $state('show tables');
	let running = $state(false);
	let error = $state<string | null>(null);
	let columns = $state<string[]>([]);
	let rows = $state<Record<string, unknown>[]>([]);
	let durationMs = $state<number | null>(null);
	let hasRun = $state(false);
	let history = $state<HistoryEntry[]>([]);
	let schema = $state<SQLNamespace>({});

	let serverConnections = $derived(
		connectionsStore.connections.filter((c) => !isFileConnection(c))
	);
	let fileConnections = $derived(connectionsStore.connections.filter(isFileConnection));
	let activeConnection = $derived(
		target === 'local' ? undefined : connectionsStore.connections.find((c) => c.id === target)
	);
	let treeConnection = $derived<DataConnection | 'local'>(activeConnection ?? 'local');
	let targetLabel = $derived(target === 'local' ? 'Local DuckDB' : (activeConnection?.name ?? '?'));

	onMount(async () => {
		history = (await get<HistoryEntry[]>(HISTORY_KEY)) ?? [];
	});

	$effect(() => {
		void target;
		void connectionsStore.connections.length;
		refreshSchema();
	});

	async function refreshSchema() {
		try {
			const tables =
				target === 'local'
					? (await runQuery('show tables')).map((row) => String(row.name))
					: activeConnection
						? await listTables(activeConnection)
						: [];
			schema = Object.fromEntries(tables.map((table) => [table, []]));
		} catch {
			schema = {};
		}
	}

	async function run() {
		if (running || !sqlText.trim()) return;
		running = true;
		error = null;
		const started = performance.now();
		try {
			const result =
				target === 'local' || !activeConnection
					? await runQueryWithColumns(sqlText)
					: await executeQuery(activeConnection, sqlText);
			columns = result.columns;
			rows = result.rows;
			durationMs = performance.now() - started;
			hasRun = true;
			history = [
				{ sql: sqlText, target: targetLabel, at: Date.now() },
				...history.filter((entry) => entry.sql !== sqlText)
			].slice(0, 30);
			await set(HISTORY_KEY, $state.snapshot(history));
			refreshSchema();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Query failed.';
			columns = [];
			rows = [];
			durationMs = null;
		} finally {
			running = false;
		}
	}

	function pickTable(table: string) {
		sqlText = `select * from "${table}" limit 100`;
		run();
	}
</script>

<div class="h-full">
	<Resizable.PaneGroup direction="horizontal">
		<Resizable.Pane defaultSize={20} minSize={14} class="flex flex-col gap-2 p-2">
			<div class="flex items-center justify-between px-1">
				<p class="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
					Databases
				</p>
				<div class="flex items-center">
					<Button
						variant="ghost"
						size="icon"
						class="size-6"
						title="Add sample data"
						onclick={() => windowManager.open('datasets')}
					>
						<DownloadSimpleIcon size={13} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="size-6"
						title="Manage connections"
						onclick={() => windowManager.open('connections')}
					>
						<PlugsIcon size={13} />
					</Button>
				</div>
			</div>
			<button
				type="button"
				class={cn(
					'hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
					target === 'local' && 'bg-accent font-medium'
				)}
				onclick={() => (target = 'local')}
			>
				<HardDrivesIcon size={14} class="text-muted-foreground shrink-0" />
				<span class="min-w-0 flex-1 truncate">Local DuckDB</span>
				<span class="text-muted-foreground text-[10px]">{fileConnections.length} files</span>
			</button>
			{#each serverConnections as connection (connection.id)}
				<button
					type="button"
					class={cn(
						'hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
						target === connection.id && 'bg-accent font-medium'
					)}
					onclick={() => (target = connection.id)}
				>
					<DatabaseIcon size={14} class="text-muted-foreground shrink-0" />
					<span class="min-w-0 flex-1 truncate">{connection.name}</span>
					<span class="text-muted-foreground text-[10px]">{connection.kind}</span>
				</button>
			{/each}
			<SchemaTree connection={treeConnection} onPickTable={pickTable} />
		</Resizable.Pane>
		<Resizable.Handle withHandle />
		<Resizable.Pane defaultSize={80}>
			<Resizable.PaneGroup direction="vertical">
				<Resizable.Pane defaultSize={40} minSize={20} class="flex flex-col">
					<div class="flex shrink-0 items-center gap-2 border-b px-2 py-1.5">
						<Button size="sm" class="h-7 text-xs" disabled={running} onclick={run}>
							{#if running}
								<CircleNotchIcon size={13} class="animate-spin" />
							{:else}
								<PlayIcon size={13} />
							{/if}
							Run
						</Button>
						<Kbd class="hidden sm:inline-flex">⌘⏎</Kbd>
						<span class="text-muted-foreground truncate text-xs">on {targetLabel}</span>
						<div class="ml-auto flex items-center gap-2">
							{#if durationMs !== null}
								<span class="text-muted-foreground text-xs">
									{rows.length.toLocaleString()} rows · {durationMs.toFixed(0)} ms
								</span>
							{/if}
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<Button {...props} variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs">
											<ClockCounterClockwiseIcon size={13} />
											History
										</Button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end" class="max-h-72 w-96 overflow-auto">
									{#each history as entry (entry.at)}
										<DropdownMenu.Item onclick={() => (sqlText = entry.sql)}>
											<div class="min-w-0">
												<p class="truncate font-mono text-xs">{entry.sql}</p>
												<p class="text-muted-foreground text-[10px]">
													{entry.target} · {new Date(entry.at).toLocaleString()}
												</p>
											</div>
										</DropdownMenu.Item>
									{:else}
										<p class="text-muted-foreground p-2 text-xs">No queries yet.</p>
									{/each}
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</div>
					<div class="min-h-0 flex-1">
						<SqlEditor bind:value={sqlText} {schema} onRun={run} />
					</div>
				</Resizable.Pane>
				<Resizable.Handle withHandle />
				<Resizable.Pane defaultSize={60} class="flex flex-col">
					{#if error}
						<div class="p-3">
							<p class="text-destructive font-mono text-xs whitespace-pre-wrap">{error}</p>
						</div>
					{:else if hasRun}
						<div class="min-h-0 flex-1">
							<TableRenderer {columns} {rows} pageSize={100} />
						</div>
					{:else}
						<div class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
							Run a query to see results. Double-click a table to preview it.
						</div>
					{/if}
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</Resizable.Pane>
	</Resizable.PaneGroup>
</div>
