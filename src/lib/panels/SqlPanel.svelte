<script lang="ts">
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { executeQuery, type QueryResult } from '$lib/query/executeQuery';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import PlayIcon from 'phosphor-svelte/lib/Play';

	let connectionId = $state('');
	let sql = $state('select 1 as value');
	let result = $state<QueryResult | null>(null);
	let error = $state<string | null>(null);
	let running = $state(false);

	async function run() {
		const connection = connectionsStore.connections.find((c) => c.id === connectionId);
		if (!connection) {
			error = 'Select a connection first.';
			return;
		}
		running = true;
		error = null;
		try {
			result = await executeQuery(connection, sql);
		} catch (err) {
			error = err instanceof Error ? err.message : 'query failed';
		} finally {
			running = false;
		}
	}
</script>

<div class="flex h-full flex-col gap-3 p-3">
	<div class="flex items-center gap-2">
		<Select.Root type="single" bind:value={connectionId}>
			<Select.Trigger class="flex-1">
				{connectionsStore.connections.find((c) => c.id === connectionId)?.name ??
					'Select a connection'}
			</Select.Trigger>
			<Select.Content>
				{#each connectionsStore.connections as connection (connection.id)}
					<Select.Item value={connection.id} label={connection.name} />
				{/each}
			</Select.Content>
		</Select.Root>
		<Button onclick={run} disabled={running}>
			<PlayIcon size={14} />
			{running ? 'Running...' : 'Run'}
		</Button>
	</div>

	<Textarea bind:value={sql} rows={5} class="shrink-0 font-mono text-xs" />

	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{/if}

	{#if result}
		<div class="min-h-0 flex-1 overflow-auto rounded-lg border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						{#each result.columns as column (column)}
							<Table.Head>{column}</Table.Head>
						{/each}
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each result.rows as row, index (index)}
						<Table.Row>
							{#each result.columns as column (column)}
								<Table.Cell>{String(row[column])}</Table.Cell>
							{/each}
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</div>
