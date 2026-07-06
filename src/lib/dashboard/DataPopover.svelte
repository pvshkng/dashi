<script lang="ts">
	import type { ChartType, Widget } from '$lib/widgets/types';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import DatabaseIcon from 'phosphor-svelte/lib/Database';

	let {
		widget,
		onChange
	}: {
		widget: Extract<Widget, { kind: 'table' | 'chart' }>;
		onChange: (widget: Widget) => void;
	} = $props();

	let open = $state(false);
	let connectionId = $state('');
	let sql = $state('');
	let chartType = $state<ChartType>('line');
	let xField = $state('');
	let yField = $state('');
	let seriesField = $state('');

	function syncFromWidget() {
		connectionId = widget.config.dataSource.connectionId;
		sql = widget.config.dataSource.sql;
		if (widget.kind === 'chart') {
			chartType = widget.config.chartType;
			xField = widget.config.x;
			yField = widget.config.y;
			seriesField = widget.config.series ?? '';
		}
	}

	const chartTypes: { value: ChartType; label: string }[] = [
		{ value: 'line', label: 'Line' },
		{ value: 'bar', label: 'Bar' },
		{ value: 'area', label: 'Area' },
		{ value: 'scatter', label: 'Scatter' },
		{ value: 'pie', label: 'Pie' }
	];

	function apply() {
		const dataSource = { connectionId, sql };
		if (widget.kind === 'chart') {
			onChange({
				...widget,
				config: {
					...widget.config,
					dataSource,
					chartType,
					x: xField,
					y: yField,
					series: seriesField || undefined
				}
			});
		} else {
			onChange({ ...widget, config: { ...widget.config, dataSource } });
		}
		open = false;
	}
</script>

<Popover.Root bind:open onOpenChange={(value) => value && syncFromWidget()}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class="text-muted-foreground hover:text-foreground p-0.5"
				title="Data mapping"
				aria-label="Widget data mapping"
			>
				<DatabaseIcon size={14} />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-80 space-y-3" side="bottom" align="start">
		<p class="text-sm font-medium">Data</p>

		<div class="space-y-1">
			<Label class="text-xs">Connection</Label>
			<Select.Root type="single" bind:value={connectionId}>
				<Select.Trigger class="h-8 w-full text-xs">
					{connectionsStore.connections.find((c) => c.id === connectionId)?.name ??
						'Select a connection'}
				</Select.Trigger>
				<Select.Content>
					{#each connectionsStore.connections as connection (connection.id)}
						<Select.Item value={connection.id} label={connection.name} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<div class="space-y-1">
			<Label class="text-xs">SQL</Label>
			<Textarea bind:value={sql} rows={3} class="font-mono text-xs" />
		</div>

		{#if widget.kind === 'chart'}
			<div class="space-y-1">
				<Label class="text-xs">Chart type</Label>
				<Select.Root type="single" bind:value={chartType}>
					<Select.Trigger class="h-8 w-full text-xs">
						{chartTypes.find((t) => t.value === chartType)?.label}
					</Select.Trigger>
					<Select.Content>
						{#each chartTypes as type (type.value)}
							<Select.Item value={type.value} label={type.label} />
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-1">
					<Label class="text-xs">X field</Label>
					<Input bind:value={xField} class="h-8 text-xs" />
				</div>
				<div class="space-y-1">
					<Label class="text-xs">Y field</Label>
					<Input bind:value={yField} class="h-8 text-xs" />
				</div>
			</div>
			<div class="space-y-1">
				<Label class="text-xs">Series field (optional)</Label>
				<Input bind:value={seriesField} class="h-8 text-xs" />
			</div>
		{/if}

		<Button size="sm" class="w-full" onclick={apply}>Apply</Button>
	</Popover.Content>
</Popover.Root>
