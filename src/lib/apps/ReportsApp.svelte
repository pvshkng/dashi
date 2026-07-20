<script lang="ts">
	import { onMount } from 'svelte';
	import {
		reportsStore,
		createReport,
		type Report,
		type ReportCell
	} from '$lib/reports/store.svelte';
	import { renderMarkdown } from '$lib/reports/markdown';
	import { runQueryWithColumns } from '$lib/duckdb/client';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import TableRenderer from '$lib/charts/TableRenderer.svelte';
	import ChartRenderer from '$lib/charts/ChartRenderer.svelte';
	import { downloadBlob } from '$lib/query/download';
	import { inlineSvg } from '$lib/export/image';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils';
	import type { ChartNodeConfig, ChartType } from '$lib/workflow/types';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import ArrowUpIcon from 'phosphor-svelte/lib/ArrowUp';
	import ArrowDownIcon from 'phosphor-svelte/lib/ArrowDown';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';
	import NotebookIcon from 'phosphor-svelte/lib/Notebook';

	interface CellResult {
		columns: string[];
		rows: Record<string, unknown>[];
		error?: string;
	}

	let selectedId = $state<string | null>(null);
	let results = $state<Record<string, CellResult>>({});
	let reportBody = $state<HTMLElement>();

	let report = $derived(reportsStore.reports.find((r) => r.id === selectedId));

	onMount(async () => {
		await reportsStore.load();
		await connectionsStore.load();
		if (!selectedId && reportsStore.reports.length > 0) selectedId = reportsStore.reports[0].id;
	});

	function addReport() {
		const created = createReport(`Report ${reportsStore.reports.length + 1}`);
		reportsStore.add(created);
		selectedId = created.id;
	}

	function patchReport(patch: Partial<Report>) {
		if (!report) return;
		reportsStore.update({ ...structuredClone($state.snapshot(report)), ...patch });
	}

	function patchCell(cellId: string, patch: Partial<ReportCell>) {
		if (!report) return;
		patchReport({
			cells: report.cells.map((cell) => (cell.id === cellId ? { ...cell, ...patch } : cell))
		});
	}

	function addCell(kind: ReportCell['kind']) {
		if (!report) return;
		patchReport({
			cells: [
				...report.cells,
				{
					id: crypto.randomUUID(),
					kind,
					text: kind === 'markdown' ? 'New section' : 'select 1 as value'
				}
			]
		});
	}

	function moveCell(cellId: string, dir: -1 | 1) {
		if (!report) return;
		const cells = [...report.cells];
		const index = cells.findIndex((cell) => cell.id === cellId);
		const target = index + dir;
		if (index === -1 || target < 0 || target >= cells.length) return;
		[cells[index], cells[target]] = [cells[target], cells[index]];
		patchReport({ cells });
	}

	async function runCell(cell: ReportCell) {
		try {
			const result = await runQueryWithColumns(cell.text);
			results = { ...results, [cell.id]: { columns: result.columns, rows: result.rows } };
		} catch (err) {
			results = {
				...results,
				[cell.id]: {
					columns: [],
					rows: [],
					error: err instanceof Error ? err.message : 'Query failed.'
				}
			};
		}
	}

	async function runAll() {
		if (!report) return;
		for (const cell of report.cells) {
			if (cell.kind === 'query') await runCell(cell);
		}
	}

	const chartTypes: ChartType[] = ['bar', 'line', 'area', 'pie', 'donut'];

	function chartConfig(cell: ReportCell): ChartNodeConfig {
		return {
			chartType: cell.chart?.chartType ?? 'bar',
			x: cell.chart?.x ?? '',
			y: cell.chart?.y ?? '',
			colorScheme: cell.chart?.colorScheme ?? 'blue'
		};
	}

	function exportHtml() {
		if (!report || !reportBody) return;
		const clone = reportBody.cloneNode(true) as HTMLElement;
		const liveSvgs = reportBody.querySelectorAll('svg');
		const cloneSvgs = clone.querySelectorAll('svg');
		for (let i = 0; i < cloneSvgs.length; i++) {
			if (liveSvgs[i]) cloneSvgs[i].replaceWith(inlineSvg(liveSvgs[i] as SVGSVGElement));
		}
		for (const el of clone.querySelectorAll('textarea, button, [data-cell-tools]')) el.remove();
		const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>${report.name}</title>
<style>
body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; color: #262626; }
h1,h2,h3 { margin: 1.2em 0 0.4em; } p { margin: 0.4em 0; line-height: 1.55; }
table { border-collapse: collapse; width: 100%; font-size: 13px; margin: 0.5em 0; }
th, td { border-bottom: 1px solid #eee; padding: 4px 8px; text-align: left; }
pre { background: #f5f5f5; padding: 0.75em; border-radius: 6px; overflow: auto; }
code { font-family: ui-monospace, monospace; font-size: 0.9em; }
</style></head><body>${clone.innerHTML}</body></html>`;
		const name = report.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-') || 'report';
		downloadBlob(`${name}.html`, 'text/html', html);
	}
</script>

<div class="flex h-full">
	<aside class="flex w-52 shrink-0 flex-col gap-1 border-r p-2">
		<Button variant="outline" size="sm" class="w-full text-xs" onclick={addReport}>
			<PlusIcon size={13} />
			New report
		</Button>
		<div class="min-h-0 flex-1 space-y-0.5 overflow-auto">
			{#each reportsStore.reports as item (item.id)}
				<button
					type="button"
					class={cn(
						'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs',
						selectedId === item.id && 'bg-accent font-medium'
					)}
					onclick={() => (selectedId = item.id)}
				>
					<NotebookIcon size={13} class="text-muted-foreground shrink-0" />
					<span class="min-w-0 flex-1 truncate">{item.name}</span>
				</button>
			{:else}
				<p class="text-muted-foreground p-2 text-xs">
					No reports yet. Mix markdown and live SQL cells into a shareable document.
				</p>
			{/each}
		</div>
	</aside>

	{#if report}
		<div class="flex min-w-0 flex-1 flex-col">
			<div class="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
				<Input
					value={report.name}
					class="h-7 w-64 border-transparent text-sm font-medium shadow-none focus-visible:border-input"
					onchange={(event) => patchReport({ name: (event.target as HTMLInputElement).value })}
				/>
				<div class="ml-auto flex items-center gap-1">
					<Button variant="outline" size="sm" class="h-7 text-xs" onclick={runAll}>
						<PlayIcon size={13} />
						Run all
					</Button>
					<Button variant="outline" size="sm" class="h-7 text-xs" onclick={exportHtml}>
						<DownloadSimpleIcon size={13} />
						Export HTML
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class="text-destructive size-7"
						title="Delete report"
						onclick={() => {
							reportsStore.remove(report.id);
							selectedId = reportsStore.reports[0]?.id ?? null;
						}}
					>
						<TrashIcon size={13} />
					</Button>
				</div>
			</div>

			<div class="min-h-0 flex-1 overflow-auto">
				<div class="mx-auto max-w-3xl space-y-4 p-4" bind:this={reportBody}>
					{#each report.cells as cell, index (cell.id)}
						{@const result = results[cell.id]}
						<div class="group relative">
							<div
								data-cell-tools
								class="absolute -top-2 right-0 z-10 flex items-center gap-0.5 rounded-md border bg-background/90 p-0.5 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100"
							>
								{#if cell.kind === 'query'}
									<Button
										variant="ghost"
										size="icon"
										class="size-6"
										title="Run"
										onclick={() => runCell(cell)}
									>
										<PlayIcon size={12} />
									</Button>
								{/if}
								<Button
									variant="ghost"
									size="icon"
									class="size-6"
									title="Move up"
									disabled={index === 0}
									onclick={() => moveCell(cell.id, -1)}
								>
									<ArrowUpIcon size={12} />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="size-6"
									title="Move down"
									disabled={index === report.cells.length - 1}
									onclick={() => moveCell(cell.id, 1)}
								>
									<ArrowDownIcon size={12} />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									class="text-destructive size-6"
									title="Delete cell"
									onclick={() =>
										patchReport({ cells: report.cells.filter((c) => c.id !== cell.id) })}
								>
									<TrashIcon size={12} />
								</Button>
							</div>

							{#if cell.kind === 'markdown'}
								<div class="prose prose-sm dark:prose-invert max-w-none">
									<!-- eslint-disable-next-line svelte/no-at-html-tags — source is escaped in renderMarkdown -->
									{@html renderMarkdown(cell.text)}
								</div>
								<Textarea
									value={cell.text}
									rows={Math.max(2, cell.text.split('\n').length)}
									class="mt-1 hidden font-mono text-xs group-focus-within:block group-hover:block"
									oninput={(event) =>
										patchCell(cell.id, { text: (event.target as HTMLTextAreaElement).value })}
								/>
							{:else}
								<Textarea
									value={cell.text}
									rows={Math.max(2, cell.text.split('\n').length)}
									class="bg-muted/40 font-mono text-xs"
									onchange={(event) =>
										patchCell(cell.id, { text: (event.target as HTMLTextAreaElement).value })}
									onkeydown={(event) => {
										if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') runCell(cell);
									}}
								/>
								{#if result?.error}
									<p class="text-destructive mt-1 font-mono text-xs">{result.error}</p>
								{:else if result}
									{@const show = cell.chart?.show ?? 'table'}
									<div data-cell-tools class="mt-1 flex items-center gap-1">
										<Select.Root
											type="single"
											value={show}
											onValueChange={(value) =>
												patchCell(cell.id, {
													chart: {
														show: value as 'table' | 'chart' | 'both',
														chartType: cell.chart?.chartType ?? 'bar',
														x: cell.chart?.x ?? result.columns[0] ?? '',
														y: cell.chart?.y ?? result.columns[1] ?? '',
														colorScheme: cell.chart?.colorScheme ?? 'blue'
													}
												})}
										>
											<Select.Trigger class="h-6 w-24 text-[10px]">{show}</Select.Trigger>
											<Select.Content>
												<Select.Item value="table" label="table" />
												<Select.Item value="chart" label="chart" />
												<Select.Item value="both" label="both" />
											</Select.Content>
										</Select.Root>
										{#if show !== 'table' && cell.chart}
											<Select.Root
												type="single"
												value={cell.chart.chartType}
												onValueChange={(value) =>
													patchCell(cell.id, {
														chart: { ...cell.chart!, chartType: value as ChartType }
													})}
											>
												<Select.Trigger class="h-6 w-20 text-[10px]">
													{cell.chart.chartType}
												</Select.Trigger>
												<Select.Content>
													{#each chartTypes as type (type)}
														<Select.Item value={type} label={type} />
													{/each}
												</Select.Content>
											</Select.Root>
											<Select.Root
												type="single"
												value={cell.chart.x}
												onValueChange={(value) =>
													patchCell(cell.id, { chart: { ...cell.chart!, x: value } })}
											>
												<Select.Trigger class="h-6 w-24 text-[10px]">
													x: {cell.chart.x || '?'}
												</Select.Trigger>
												<Select.Content>
													{#each result.columns as column (column)}
														<Select.Item value={column} label={column} />
													{/each}
												</Select.Content>
											</Select.Root>
											<Select.Root
												type="single"
												value={cell.chart.y}
												onValueChange={(value) =>
													patchCell(cell.id, { chart: { ...cell.chart!, y: value } })}
											>
												<Select.Trigger class="h-6 w-24 text-[10px]">
													y: {cell.chart.y || '?'}
												</Select.Trigger>
												<Select.Content>
													{#each result.columns as column (column)}
														<Select.Item value={column} label={column} />
													{/each}
												</Select.Content>
											</Select.Root>
										{/if}
										<span class="text-muted-foreground ml-auto text-[10px]">
											{result.rows.length.toLocaleString()} rows
										</span>
									</div>
									{#if show !== 'chart'}
										<div class="mt-1 max-h-64 overflow-auto rounded-lg border">
											<TableRenderer columns={result.columns} rows={result.rows} pageSize={15} />
										</div>
									{/if}
									{#if show !== 'table'}
										<div class="mt-1 h-64 rounded-lg border p-2">
											<ChartRenderer rows={result.rows} config={chartConfig(cell)} />
										</div>
									{/if}
								{/if}
							{/if}
						</div>
					{/each}

					<div data-cell-tools class="flex items-center gap-2 pt-2">
						<Button variant="outline" size="sm" class="text-xs" onclick={() => addCell('markdown')}>
							<PlusIcon size={12} />
							Markdown
						</Button>
						<Button variant="outline" size="sm" class="text-xs" onclick={() => addCell('query')}>
							<PlusIcon size={12} />
							SQL query
						</Button>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="text-muted-foreground flex flex-1 items-center justify-center text-sm">
			Create a report to mix markdown notes with live SQL results.
		</div>
	{/if}
</div>
