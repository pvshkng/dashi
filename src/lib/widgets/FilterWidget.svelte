<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import { runQueryWithColumns } from '$lib/duckdb/client';
	import { viewName } from '$lib/workflow/engine';
	import { dashboardFilters } from '$lib/dashboard/filters.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import type { FilterWidget } from './types';
	import XIcon from 'phosphor-svelte/lib/X';

	let { widget }: { widget: FilterWidget } = $props();

	let config = $derived(widget.config);
	let filterId = $derived(`widget:${widget.id}`);
	let active = $derived(dashboardFilters.filters.find((filter) => filter.id === filterId));

	let options = $state<string[]>([]);
	let optionsError = $state(false);

	$effect(() => {
		const workflowId = config.optionsWorkflowId;
		const nodeId = config.optionsNodeId;
		const column = config.column;
		if (!workflowId || !nodeId || !column) {
			options = [];
			return;
		}
		const workflow = workspaceStore.workflowById(workflowId);
		if (!workflow) return;
		let cancelled = false;
		void (async () => {
			try {
				await workflowRuntime.ensure(workflow);
				const view = viewName(workflowId, nodeId);
				const result = await runQueryWithColumns(
					`select distinct "${column.replaceAll('"', '""')}"::varchar as v from ${view} order by 1 limit 500`
				);
				if (!cancelled) {
					options = result.rows.map((row) => String(row.v ?? ''));
					optionsError = false;
				}
			} catch {
				if (!cancelled) optionsError = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});

	function clear() {
		dashboardFilters.remove(filterId);
	}

	function setEq(value: string) {
		if (!value) {
			clear();
			return;
		}
		dashboardFilters.set({ id: filterId, column: config.column, op: 'eq', value });
	}

	function setContains(value: string) {
		if (!value.trim()) {
			clear();
			return;
		}
		dashboardFilters.set({ id: filterId, column: config.column, op: 'contains', value });
	}

	function toggleMulti(option: string, checked: boolean) {
		const current = active?.values ?? [];
		const values = checked ? [...current, option] : current.filter((v) => v !== option);
		if (values.length === 0) {
			clear();
			return;
		}
		dashboardFilters.set({ id: filterId, column: config.column, op: 'in', value: '', values });
	}

	function setRange(from: string, to: string) {
		if (from === '' && to === '') {
			clear();
			return;
		}
		dashboardFilters.set({
			id: filterId,
			column: config.column,
			op: 'between',
			value: from,
			value2: to
		});
	}
</script>

<div class="flex h-full w-full flex-col gap-1.5 p-1">
	{#if !config.column}
		<p class="text-muted-foreground text-xs">Pick a column in the widget settings.</p>
	{:else if config.control === 'dropdown'}
		<div class="flex items-center gap-1">
			<Select.Root type="single" value={active?.value ?? ''} onValueChange={setEq}>
				<Select.Trigger class="h-8 w-full text-xs">
					{active?.value ?? `All ${config.column}`}
				</Select.Trigger>
				<Select.Content>
					{#each options as option (option)}
						<Select.Item value={option} label={option} />
					{/each}
				</Select.Content>
			</Select.Root>
			{#if active}
				<button type="button" class="text-muted-foreground hover:text-foreground" onclick={clear}>
					<XIcon size={14} />
				</button>
			{/if}
		</div>
	{:else if config.control === 'multi'}
		<div class="min-h-0 flex-1 space-y-1 overflow-auto">
			{#each options as option (option)}
				<label class="flex items-center gap-2 text-xs">
					<input
						type="checkbox"
						checked={(active?.values ?? []).includes(option)}
						onchange={(event) => toggleMulti(option, (event.target as HTMLInputElement).checked)}
					/>
					<span class="truncate">{option}</span>
				</label>
			{:else}
				<p class="text-muted-foreground text-xs">
					{optionsError ? 'Could not load values.' : 'Link an options node in settings.'}
				</p>
			{/each}
		</div>
	{:else if config.control === 'search'}
		<Input
			value={active?.value ?? ''}
			placeholder={`Search ${config.column}…`}
			class="h-8 text-xs"
			oninput={(event) => setContains((event.target as HTMLInputElement).value)}
		/>
	{:else if config.control === 'range'}
		<div class="flex items-center gap-1">
			<Input
				type="number"
				value={active?.value ?? ''}
				placeholder="min"
				class="h-8 text-xs"
				onchange={(event) =>
					setRange((event.target as HTMLInputElement).value, active?.value2 ?? '')}
			/>
			<span class="text-muted-foreground text-xs">–</span>
			<Input
				type="number"
				value={active?.value2 ?? ''}
				placeholder="max"
				class="h-8 text-xs"
				onchange={(event) =>
					setRange(active?.value ?? '', (event.target as HTMLInputElement).value)}
			/>
		</div>
	{:else if config.control === 'daterange'}
		<div class="flex items-center gap-1">
			<Input
				type="date"
				value={active?.value ?? ''}
				class="h-8 text-xs"
				onchange={(event) =>
					setRange((event.target as HTMLInputElement).value, active?.value2 ?? '')}
			/>
			<span class="text-muted-foreground text-xs">–</span>
			<Input
				type="date"
				value={active?.value2 ?? ''}
				class="h-8 text-xs"
				onchange={(event) =>
					setRange(active?.value ?? '', (event.target as HTMLInputElement).value)}
			/>
		</div>
	{/if}
</div>
