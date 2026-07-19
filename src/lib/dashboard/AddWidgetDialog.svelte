<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { isVizKind, getNodeDef } from '$lib/workflow/defs';
	import type { Widget, WidgetLayout } from '$lib/widgets/types';
	import TextTIcon from 'phosphor-svelte/lib/TextT';
	import ChartBarIcon from 'phosphor-svelte/lib/ChartBar';
	import TableIcon from 'phosphor-svelte/lib/Table';
	import NumberCircleOneIcon from 'phosphor-svelte/lib/NumberCircleOne';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const vizIcons = { chart: ChartBarIcon, grid: TableIcon, metric: NumberCircleOneIcon } as const;

	let vizOptions = $derived(
		workspaceStore.workflows.flatMap((workflow) =>
			workflow.nodes.filter((node) => isVizKind(node.kind)).map((node) => ({ workflow, node }))
		)
	);

	function nextLayout(w: number, h: number): WidgetLayout {
		const bottom = Math.max(0, ...workspaceStore.widgets.map((x) => x.layout.y + x.layout.h));
		return { x: 0, y: bottom, w, h };
	}

	function addText() {
		const widget: Widget = {
			id: crypto.randomUUID(),
			title: 'Text',
			kind: 'text',
			layout: nextLayout(4, 2),
			config: { content: 'New text widget' }
		};
		workspaceStore.addWidget(widget);
		open = false;
	}

	function addViz(workflowId: string, nodeId: string, title: string, kind: string) {
		const widget: Widget = {
			id: crypto.randomUUID(),
			title,
			kind: 'viz',
			layout: kind === 'metric' ? nextLayout(3, 2) : nextLayout(6, 4),
			config: { workflowId, nodeId }
		};
		workspaceStore.addWidget(widget);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add widget</Dialog.Title>
			<Dialog.Description>
				Pick an output node from a workflow, or add a text block.
			</Dialog.Description>
		</Dialog.Header>
		<div class="flex max-h-80 flex-col gap-1 overflow-auto">
			<Button variant="outline" class="justify-start" onclick={addText}>
				<TextTIcon size={16} />
				Text block
			</Button>
			{#each vizOptions as option (option.workflow.id + option.node.id)}
				{@const Icon = vizIcons[option.node.kind as keyof typeof vizIcons]}
				<Button
					variant="outline"
					class="justify-start"
					onclick={() =>
						addViz(option.workflow.id, option.node.id, option.node.label, option.node.kind)}
				>
					<Icon size={16} />
					<span class="truncate">{option.node.label}</span>
					<span class="text-muted-foreground ml-auto truncate text-xs">
						{option.workflow.name} · {getNodeDef(option.node.kind).label}
					</span>
				</Button>
			{/each}
			{#if vizOptions.length === 0}
				<p class="text-muted-foreground p-2 text-xs">
					No output nodes yet. Add a chart, table view or metric node to a workflow first.
				</p>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
