<script lang="ts">
	import * as Table from '$lib/components/ui/table';

	let {
		columns,
		rows,
		pageSize = 50
	}: {
		columns: string[];
		rows: Record<string, unknown>[];
		pageSize?: number;
	} = $props();

	let rawPage = $state(0);
	let pageCount = $derived(Math.max(1, Math.ceil(rows.length / pageSize)));
	let page = $derived(Math.min(rawPage, pageCount - 1));
	let visible = $derived(rows.slice(page * pageSize, (page + 1) * pageSize));

	function format(value: unknown): string {
		if (value === null || value === undefined) return '';
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	}
</script>

<div class="flex h-full w-full flex-col">
	<div class="min-h-0 flex-1 overflow-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#each columns as column (column)}
						<Table.Head class="whitespace-nowrap">{column}</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each visible as row, index (index)}
					<Table.Row>
						{#each columns as column (column)}
							<Table.Cell class="whitespace-nowrap">{format(row[column])}</Table.Cell>
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	{#if pageCount > 1}
		<div
			class="text-muted-foreground flex items-center justify-end gap-2 border-t px-2 py-1 text-xs"
		>
			<button
				type="button"
				class="hover:text-foreground"
				disabled={page === 0}
				onclick={() => (rawPage = page - 1)}
			>
				Prev
			</button>
			<span>{page + 1} / {pageCount}</span>
			<button
				type="button"
				class="hover:text-foreground"
				disabled={page >= pageCount - 1}
				onclick={() => (rawPage = page + 1)}
			>
				Next
			</button>
		</div>
	{/if}
</div>
