<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { isVizKind, getNodeDef } from '$lib/workflow/defs';
	import {
		workflowTemplates,
		addTemplateToDashboard,
		type WorkflowTemplate
	} from '$lib/workflow/templates';
	import TemplateThumb from '$lib/charts/TemplateThumb.svelte';
	import type { ShapeKind, Widget, WidgetLayout } from '$lib/widgets/types';
	import { toast } from 'svelte-sonner';
	import TextTIcon from 'phosphor-svelte/lib/TextT';
	import TextHOneIcon from 'phosphor-svelte/lib/TextHOne';
	import ChartBarIcon from 'phosphor-svelte/lib/ChartBar';
	import TableIcon from 'phosphor-svelte/lib/Table';
	import NumberCircleOneIcon from 'phosphor-svelte/lib/NumberCircleOne';
	import FunnelIcon from 'phosphor-svelte/lib/Funnel';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import SquareIcon from 'phosphor-svelte/lib/Square';
	import CircleIcon from 'phosphor-svelte/lib/Circle';
	import TriangleIcon from 'phosphor-svelte/lib/Triangle';
	import MinusIcon from 'phosphor-svelte/lib/Minus';
	import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRight';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	let busyTemplate = $state<string | null>(null);

	async function addPrebuilt(template: WorkflowTemplate) {
		busyTemplate = template.id;
		try {
			await addTemplateToDashboard(template);
			toast.success(`“${template.name}” added with its data source`);
			open = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not load the template data.');
		} finally {
			busyTemplate = null;
		}
	}

	const vizIcons = {
		chart: ChartBarIcon,
		grid: TableIcon,
		metric: NumberCircleOneIcon,
		pivottable: TableIcon
	} as const;

	let vizOptions = $derived(
		workspaceStore.workflows.flatMap((workflow) =>
			workflow.nodes.filter((node) => isVizKind(node.kind)).map((node) => ({ workflow, node }))
		)
	);

	function nextLayout(w: number, h: number): WidgetLayout {
		const bottom = Math.max(0, ...workspaceStore.widgets.map((x) => x.layout.y + x.layout.h));
		return { x: 0, y: bottom, w, h };
	}

	function addText(heading = false) {
		const widget: Widget = {
			id: crypto.randomUUID(),
			title: heading ? 'Heading' : 'Text',
			kind: 'text',
			layout: heading ? nextLayout(6, 1) : nextLayout(4, 2),
			style: heading ? { showHeader: false, fontSize: 28 } : { showHeader: false },
			config: { content: heading ? 'Dashboard title' : 'New text block' }
		};
		workspaceStore.addWidget(widget);
		open = false;
	}

	const shapeOptions: { shape: ShapeKind; label: string; icon: typeof SquareIcon }[] = [
		{ shape: 'rectangle', label: 'Rectangle', icon: SquareIcon },
		{ shape: 'ellipse', label: 'Ellipse', icon: CircleIcon },
		{ shape: 'triangle', label: 'Triangle', icon: TriangleIcon },
		{ shape: 'line', label: 'Line', icon: MinusIcon },
		{ shape: 'arrow', label: 'Arrow', icon: ArrowRightIcon }
	];

	function addFilter() {
		const widget: Widget = {
			id: crypto.randomUUID(),
			title: 'Filter',
			kind: 'filter',
			layout: nextLayout(3, 1),
			config: { column: '', control: 'dropdown' }
		};
		workspaceStore.addWidget(widget);
		open = false;
	}

	function addShape(shape: ShapeKind) {
		const widget: Widget = {
			id: crypto.randomUUID(),
			title: shapeOptions.find((option) => option.shape === shape)?.label ?? 'Shape',
			kind: 'shape',
			layout: shape === 'line' || shape === 'arrow' ? nextLayout(4, 1) : nextLayout(3, 3),
			style: { showHeader: false },
			config: { shape, fill: '#e2e8f0', stroke: '#64748b', strokeWidth: 2 }
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
		<div class="flex max-h-96 flex-col gap-1 overflow-auto">
			<p class="text-muted-foreground px-1 text-[10px] font-semibold tracking-wide uppercase">
				Elements
			</p>
			<div class="grid grid-cols-2 gap-1.5">
				<Button variant="outline" class="justify-start" onclick={() => addText(true)}>
					<TextHOneIcon size={16} />
					Heading
				</Button>
				<Button variant="outline" class="justify-start" onclick={() => addText(false)}>
					<TextTIcon size={16} />
					Text block
				</Button>
				<Button variant="outline" class="justify-start" onclick={addFilter}>
					<FunnelIcon size={16} />
					Filter control
				</Button>
			</div>
			<div class="grid grid-cols-5 gap-1.5">
				{#each shapeOptions as option (option.shape)}
					<Button
						variant="outline"
						size="icon"
						class="w-full"
						title={option.label}
						onclick={() => addShape(option.shape)}
					>
						<option.icon size={16} />
					</Button>
				{/each}
			</div>

			<p class="text-muted-foreground mt-2 px-1 text-[10px] font-semibold tracking-wide uppercase">
				Workflow outputs
			</p>
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

			<p class="text-muted-foreground mt-2 px-1 text-[10px] font-semibold tracking-wide uppercase">
				Prebuilt charts with data
			</p>
			<div class="grid grid-cols-2 gap-1.5">
				{#each workflowTemplates as template (template.id)}
					<button
						type="button"
						class="hover:border-primary/50 hover:bg-accent/40 flex items-center gap-2 rounded-lg border p-2 text-left transition-colors disabled:opacity-50"
						disabled={busyTemplate !== null}
						onclick={() => addPrebuilt(template)}
					>
						<span
							class="bg-muted/40 flex h-9 w-14 shrink-0 items-center justify-center rounded border p-1"
						>
							{#if busyTemplate === template.id}
								<CircleNotchIcon size={14} class="animate-spin" />
							{:else}
								<TemplateThumb kind={template.thumb} />
							{/if}
						</span>
						<span class="min-w-0">
							<span class="block truncate text-xs font-medium">{template.name}</span>
							<span class="text-muted-foreground block truncate text-[10px]">
								{template.dataLabel}
							</span>
						</span>
					</button>
				{/each}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>
