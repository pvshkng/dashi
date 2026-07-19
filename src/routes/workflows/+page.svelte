<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { createWorkflow } from '$lib/workflow/types';
	import { isVizKind } from '$lib/workflow/defs';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import CopyIcon from 'phosphor-svelte/lib/Copy';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';

	function newWorkflow() {
		const workflow = createWorkflow('Untitled workflow');
		workspaceStore.addWorkflow(workflow);
		goto(resolve('/workflows/[id]', { id: workflow.id }));
	}

	function widgetCount(workflowId: string): number {
		return workspaceStore.widgets.filter(
			(widget) => widget.kind === 'viz' && widget.config.workflowId === workflowId
		).length;
	}

	function outputCount(workflowId: string): number {
		const workflow = workspaceStore.workflowById(workflowId);
		return workflow?.nodes.filter((node) => isVizKind(node.kind)).length ?? 0;
	}

	function remove(workflowId: string) {
		const used = widgetCount(workflowId);
		const suffix = used > 0 ? ` This also removes ${used} dashboard widget(s) using it.` : '';
		if (confirm(`Delete this workflow?${suffix}`)) {
			workspaceStore.removeWorkflow(workflowId);
		}
	}
</script>

<svelte:head><title>Workflows — Dashi</title></svelte:head>

<main class="mx-auto max-w-4xl space-y-4 p-6">
	<div class="flex items-center justify-between gap-2">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Workflows</h1>
			<p class="text-muted-foreground text-sm">
				Reusable pipelines. Every output node can feed any number of dashboard widgets.
			</p>
		</div>
		<Button onclick={newWorkflow}>
			<PlusIcon size={16} />
			New workflow
		</Button>
	</div>

	<div class="grid gap-3 sm:grid-cols-2">
		{#each workspaceStore.workflows as workflow (workflow.id)}
			<div class="hover:border-primary/50 group relative rounded-xl border p-4 transition-colors">
				<a href={resolve('/workflows/[id]', { id: workflow.id })} class="absolute inset-0">
					<span class="sr-only">Open {workflow.name}</span>
				</a>
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0">
						<p class="flex items-center gap-1.5 truncate text-sm font-medium">
							<FlowArrowIcon size={15} class="text-primary shrink-0" />
							{workflow.name}
						</p>
						<p class="text-muted-foreground mt-1 text-xs">
							{workflow.nodes.length} nodes · {outputCount(workflow.id)} outputs · used by
							{widgetCount(workflow.id)} widget(s)
						</p>
						<p class="text-muted-foreground text-xs">
							Updated {new Date(workflow.updatedAt).toLocaleString()}
						</p>
					</div>
					<div
						class="relative z-10 flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<Button
							variant="ghost"
							size="icon"
							class="size-7"
							title="Duplicate"
							onclick={() => workspaceStore.duplicateWorkflow(workflow.id)}
						>
							<CopyIcon size={14} />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							class="text-destructive size-7"
							title="Delete"
							onclick={() => remove(workflow.id)}
						>
							<TrashIcon size={14} />
						</Button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if workspaceStore.loaded && workspaceStore.workflows.length === 0}
		<div class="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
			No workflows yet. Create one and drag nodes onto the canvas: connect a source, shape the data,
			end in a chart, table or metric.
		</div>
	{/if}
</main>
