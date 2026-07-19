<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { createWorkflow } from '$lib/workflow/types';
	import { isVizKind } from '$lib/workflow/defs';
	import {
		workflowTemplates,
		instantiateTemplate,
		addTemplateToDashboard,
		type WorkflowTemplate
	} from '$lib/workflow/templates';
	import TemplateThumb from '$lib/charts/TemplateThumb.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import CopyIcon from 'phosphor-svelte/lib/Copy';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';

	let busy = $state<Record<string, boolean>>({});

	let hasWorkflows = $derived(workspaceStore.workflows.length > 0);

	function newWorkflow() {
		const workflow = createWorkflow('Untitled workflow');
		workspaceStore.addWorkflow(workflow);
		goto(resolve('/workflows/[id]', { id: workflow.id }));
	}

	async function useTemplate(template: WorkflowTemplate) {
		busy[template.id] = true;
		try {
			const workflow = await instantiateTemplate(template);
			goto(resolve('/workflows/[id]', { id: workflow.id }));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not load the template data.');
		} finally {
			busy[template.id] = false;
		}
	}

	async function plugIntoDashboard(template: WorkflowTemplate) {
		busy[template.id] = true;
		try {
			await addTemplateToDashboard(template);
			toast.success(`“${template.name}” added to the dashboard`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not load the template data.');
		} finally {
			busy[template.id] = false;
		}
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

<div class="mx-auto max-w-5xl space-y-8 p-6">
	{#if !hasWorkflows && workspaceStore.loaded}
		<div class="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-10 text-center">
			<SparkleIcon size={28} class="text-primary" />
			<div>
				<h2 class="text-lg font-semibold tracking-tight">Build your first widget</h2>
				<p class="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
					A workflow turns data into widgets: connect a source, shape it, end in a chart. Start
					fresh or pick a template below, every template downloads its own sample data.
				</p>
			</div>
			<Button onclick={newWorkflow}>
				<PlusIcon size={16} />
				Start fresh
			</Button>
		</div>
	{:else}
		<div class="flex items-center justify-between gap-2">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Workflows</h1>
				<p class="text-muted-foreground text-sm">
					Reusable pipelines. Every output node can feed any number of dashboard widgets.
				</p>
			</div>
			<Button onclick={newWorkflow}>
				<PlusIcon size={16} />
				Start fresh
			</Button>
		</div>
	{/if}

	{#if hasWorkflows}
		<section class="space-y-3">
			<h2 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
				Your workflows
			</h2>
			<div class="grid gap-3 sm:grid-cols-2">
				{#each workspaceStore.workflows as workflow (workflow.id)}
					<div
						class="hover:border-primary/50 group relative rounded-xl border p-4 transition-colors"
					>
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
		</section>
	{/if}

	<section class="space-y-3">
		<div>
			<h2 class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Templates</h2>
			<p class="text-muted-foreground text-xs">
				Prebuilt charts with real open data. Open one in the builder, or plug it straight into the
				dashboard.
			</p>
		</div>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{#each workflowTemplates as template (template.id)}
				<div
					class="group hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border transition-colors"
				>
					<div class="bg-muted/40 flex h-28 items-center justify-center border-b p-3">
						<TemplateThumb kind={template.thumb} />
					</div>
					<div class="flex flex-1 flex-col gap-1 p-3">
						<p class="text-sm font-medium">{template.name}</p>
						<p class="text-muted-foreground line-clamp-2 text-xs">{template.description}</p>
						<p class="text-muted-foreground mt-auto pt-1 text-[10px] tracking-wide uppercase">
							{template.dataLabel}
						</p>
						<div class="mt-1.5 flex gap-1.5">
							<Button
								variant="outline"
								size="sm"
								class="h-7 flex-1 gap-1 text-xs"
								disabled={busy[template.id]}
								onclick={() => useTemplate(template)}
							>
								{#if busy[template.id]}
									<CircleNotchIcon size={12} class="animate-spin" />
								{:else}
									<FlowArrowIcon size={12} />
								{/if}
								Open
							</Button>
							<Button
								variant="ghost"
								size="sm"
								class="h-7 flex-1 gap-1 text-xs"
								title="Add to dashboard with its data source"
								disabled={busy[template.id]}
								onclick={() => plugIntoDashboard(template)}
							>
								<SquaresFourIcon size={12} />
								To dashboard
							</Button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
