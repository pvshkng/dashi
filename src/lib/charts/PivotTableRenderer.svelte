<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { AggregateFn, PivotTableNodeConfig } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let { rows, config }: { rows: Record<string, unknown>[]; config: PivotTableNodeConfig } =
		$props();

	const SEP = ' / ';

	function aggregate(values: number[], fn: AggregateFn, distinctSource: unknown[]): number {
		if (fn === 'count') return distinctSource.length;
		if (fn === 'count_distinct') return new Set(distinctSource.map(String)).size;
		if (values.length === 0) return 0;
		switch (fn) {
			case 'sum':
				return values.reduce((a, b) => a + b, 0);
			case 'avg':
				return values.reduce((a, b) => a + b, 0) / values.length;
			case 'min':
				return Math.min(...values);
			case 'max':
				return Math.max(...values);
			case 'median': {
				const sorted = [...values].toSorted((a, b) => a - b);
				const mid = Math.floor(sorted.length / 2);
				return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
			}
			case 'stddev': {
				const mean = values.reduce((a, b) => a + b, 0) / values.length;
				if (values.length < 2) return 0;
				const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (values.length - 1);
				return Math.sqrt(variance);
			}
		}
		return 0;
	}

	let pivot = $derived.by(() => {
		const cells = new SvelteMap<string, { values: number[]; raw: unknown[] }>();
		const rowKeySet: string[] = [];
		const colKeySet: string[] = [];
		const seenRow = new SvelteSet<string>();
		const seenCol = new SvelteSet<string>();

		for (const row of rows) {
			const rowKey = config.rows.map((c) => String(row[c] ?? '')).join(SEP) || 'All';
			const colKey = config.cols.map((c) => String(row[c] ?? '')).join(SEP) || 'Value';
			if (!seenRow.has(rowKey)) {
				seenRow.add(rowKey);
				rowKeySet.push(rowKey);
			}
			if (!seenCol.has(colKey)) {
				seenCol.add(colKey);
				colKeySet.push(colKey);
			}
			const raw = row[config.valueColumn];
			const num = toNumber(raw);
			for (const key of [
				`${rowKey}\u0000${colKey}`,
				`${rowKey}\u0000total`,
				`total\u0000${colKey}`,
				`total\u0000total`
			]) {
				if (!cells.has(key)) cells.set(key, { values: [], raw: [] });
				const cell = cells.get(key)!;
				if (num !== null) cell.values.push(num);
				if (raw !== null && raw !== undefined) cell.raw.push(raw);
			}
		}

		function value(rowKey: string, colKey: string): number | null {
			const cell = cells.get(`${rowKey}\u0000${colKey}`);
			if (!cell) return null;
			return aggregate(cell.values, config.fn, cell.raw);
		}

		return { rowKeys: rowKeySet, colKeys: colKeySet, value };
	});
</script>

{#if !config.valueColumn}
	<p class="text-muted-foreground p-2 text-sm">Pick a value column.</p>
{:else}
	<div class="h-full w-full overflow-auto text-xs">
		<table class="w-full border-collapse">
			<thead class="bg-background/90 sticky top-0 backdrop-blur-sm">
				<tr>
					<th class="border-b px-2 py-1 text-left font-medium">
						{config.rows.join(SEP) || ''}
					</th>
					{#each pivot.colKeys as colKey (colKey)}
						<th class="border-b px-2 py-1 text-right font-medium whitespace-nowrap">{colKey}</th>
					{/each}
					{#if config.showTotals && pivot.colKeys.length > 1}
						<th class="border-b px-2 py-1 text-right font-semibold">Total</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each pivot.rowKeys as rowKey (rowKey)}
					<tr class="hover:bg-accent/40">
						<td class="border-b px-2 py-1 whitespace-nowrap">{rowKey}</td>
						{#each pivot.colKeys as colKey (colKey)}
							<td class="border-b px-2 py-1 text-right tabular-nums">
								{formatValue(pivot.value(rowKey, colKey), config.format)}
							</td>
						{/each}
						{#if config.showTotals && pivot.colKeys.length > 1}
							<td class="border-b px-2 py-1 text-right font-medium tabular-nums">
								{formatValue(pivot.value(rowKey, 'total'), config.format)}
							</td>
						{/if}
					</tr>
				{/each}
				{#if config.showTotals && pivot.rowKeys.length > 1}
					<tr class="font-medium">
						<td class="px-2 py-1">Total</td>
						{#each pivot.colKeys as colKey (colKey)}
							<td class="px-2 py-1 text-right tabular-nums">
								{formatValue(pivot.value('total', colKey), config.format)}
							</td>
						{/each}
						{#if pivot.colKeys.length > 1}
							<td class="px-2 py-1 text-right tabular-nums">
								{formatValue(pivot.value('total', 'total'), config.format)}
							</td>
						{/if}
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
{/if}
