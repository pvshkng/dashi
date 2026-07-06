<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import type { TableWidget } from './types';
	import type { DataConnection } from '$lib/connections/types';
	import { executeQuery } from '$lib/query/executeQuery';

	let { widget, connection }: { widget: TableWidget; connection: DataConnection | undefined } =
		$props();

	let columns = $state<string[]>([]);
	let rows = $state<Record<string, unknown>[]>([]);
	let error = $state<string | null>(null);

	$effect(() => {
		if (!connection) return;
		executeQuery(connection, widget.config.dataSource.sql)
			.then((result) => {
				columns = result.columns;
				rows = result.rows;
				error = null;
			})
			.catch((err: unknown) => {
				error = err instanceof Error ? err.message : 'query failed';
			});
	});
</script>

<div class="h-full w-full overflow-auto">
	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{:else if !connection}
		<p class="text-muted-foreground text-sm">No connection selected.</p>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#each columns as column (column)}
						<Table.Head>{column}</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each rows as row, index (index)}
					<Table.Row>
						{#each columns as column (column)}
							<Table.Cell>{String(row[column])}</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
