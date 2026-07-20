<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';
	import { downloadBlob, toCsv } from '$lib/query/download';
	import CaretUpIcon from 'phosphor-svelte/lib/CaretUp';
	import CaretDownIcon from 'phosphor-svelte/lib/CaretDown';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';

	let {
		columns,
		rows,
		pageSize = 50,
		format,
		exportable = false,
		exportName = 'table',
		onCellClick
	}: {
		columns: string[];
		rows: Record<string, unknown>[];
		pageSize?: number;
		format?: ValueFormat;
		exportable?: boolean;
		exportName?: string;
		onCellClick?: (column: string, value: string) => void;
	} = $props();

	let rawPage = $state(0);
	let sortColumn = $state<string | null>(null);
	let sortDir = $state<'asc' | 'desc'>('asc');

	let sorted = $derived.by(() => {
		if (!sortColumn) return rows;
		const column = sortColumn;
		const dir = sortDir === 'asc' ? 1 : -1;
		return rows.toSorted((a, b) => {
			const na = toNumber(a[column]);
			const nb = toNumber(b[column]);
			if (na !== null && nb !== null) return (na - nb) * dir;
			return String(a[column] ?? '').localeCompare(String(b[column] ?? '')) * dir;
		});
	});

	let pageCount = $derived(Math.max(1, Math.ceil(sorted.length / pageSize)));
	let page = $derived(Math.min(rawPage, pageCount - 1));
	let visible = $derived(sorted.slice(page * pageSize, (page + 1) * pageSize));

	function toggleSort(column: string) {
		if (sortColumn === column) {
			if (sortDir === 'asc') sortDir = 'desc';
			else {
				sortColumn = null;
				sortDir = 'asc';
			}
		} else {
			sortColumn = column;
			sortDir = 'asc';
		}
	}

	function display(value: unknown): string {
		if (value === null || value === undefined) return '';
		if (typeof value === 'object') return JSON.stringify(value);
		const num = toNumber(value);
		if (num !== null && typeof value !== 'string') return formatValue(num, format);
		if (num !== null && format) return formatValue(num, format);
		return String(value);
	}

	function exportCsv() {
		downloadBlob(`${exportName}.csv`, 'text/csv', toCsv(columns, sorted));
	}
</script>

<div class="flex h-full w-full flex-col">
	<div class="min-h-0 flex-1 overflow-auto">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					{#each columns as column (column)}
						<Table.Head class="whitespace-nowrap">
							<button
								type="button"
								class="hover:text-foreground inline-flex items-center gap-1"
								onclick={() => toggleSort(column)}
							>
								{column}
								{#if sortColumn === column}
									{#if sortDir === 'asc'}
										<CaretUpIcon size={11} />
									{:else}
										<CaretDownIcon size={11} />
									{/if}
								{/if}
							</button>
						</Table.Head>
					{/each}
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each visible as row, index (index)}
					<Table.Row>
						{#each columns as column (column)}
							{#if onCellClick}
								<Table.Cell
									class="hover:bg-accent/60 cursor-pointer whitespace-nowrap"
									onclick={() => onCellClick(column, String(row[column] ?? ''))}
								>
									{display(row[column])}
								</Table.Cell>
							{:else}
								<Table.Cell class="whitespace-nowrap">{display(row[column])}</Table.Cell>
							{/if}
						{/each}
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
	{#if pageCount > 1 || exportable}
		<div
			class="text-muted-foreground flex items-center justify-end gap-2 border-t px-2 py-1 text-xs"
		>
			{#if exportable}
				<button
					type="button"
					class="hover:text-foreground mr-auto inline-flex items-center gap-1"
					title="Download CSV"
					onclick={exportCsv}
				>
					<DownloadSimpleIcon size={12} />
					CSV
				</button>
			{/if}
			{#if pageCount > 1}
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
			{/if}
		</div>
	{/if}
</div>
