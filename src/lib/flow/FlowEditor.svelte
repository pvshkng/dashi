<script lang="ts">
	import {
		SvelteFlow,
		Background,
		BackgroundVariant,
		Controls,
		MiniMap,
		useSvelteFlow,
		type Node,
		type Edge,
		type Connection,
		type NodeTypes
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { setContext } from 'svelte';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import { getNodeDef } from '$lib/workflow/defs';
	import { wouldCycle } from '$lib/workflow/engine';
	import type { NodeKind, Workflow, WorkflowEdge, WorkflowNode } from '$lib/workflow/types';
	import type { Widget } from '$lib/widgets/types';
	import FlowNode from './FlowNode.svelte';
	import NodePalette from './NodePalette.svelte';
	import NodeConfigPanel from './NodeConfigPanel.svelte';
	import PreviewPanel from './PreviewPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import ChartLineUpIcon from 'phosphor-svelte/lib/ChartLineUp';
	import { toast } from 'svelte-sonner';

	let { workflow }: { workflow: Workflow } = $props();

	setContext('dashi:workflowId', () => workflow.id);

	const nodeTypes: NodeTypes = { dashi: FlowNode };
	const { screenToFlowPosition } = useSvelteFlow();

	function toXyNodes(source: Workflow): Node[] {
		return source.nodes.map((node) => ({
			id: node.id,
			type: 'dashi',
			position: { ...node.position },
			data: { kind: node.kind, label: node.label, config: node.config }
		}));
	}

	function toXyEdges(source: Workflow): Edge[] {
		return source.edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			targetHandle: edge.targetHandle
		}));
	}

	let nodes = $state.raw<Node[]>([]);
	let edges = $state.raw<Edge[]>([]);
	let selectedNodeId = $state<string | null>(null);
	let previewOpen = $state(true);
	let appliedAt = -1;

	// Re-map from the store when the workflow changed elsewhere (other window/tab).
	$effect(() => {
		if (workflow.updatedAt !== appliedAt) {
			nodes = toXyNodes(workflow);
			edges = toXyEdges(workflow);
			appliedAt = workflow.updatedAt;
		}
	});

	$effect(() => {
		void workflow.updatedAt;
		workflowRuntime.ensure(workflow);
	});

	function currentModel(): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
		return {
			nodes: nodes.map((node) => ({
				id: node.id,
				kind: node.data.kind as NodeKind,
				label: node.data.label as string,
				position: { x: node.position.x, y: node.position.y },
				config: node.data.config as WorkflowNode['config']
			})),
			edges: edges.map((edge) => ({
				id: edge.id,
				source: edge.source,
				target: edge.target,
				targetHandle: edge.targetHandle ?? undefined
			}))
		};
	}

	function persist(touch = true) {
		const model = currentModel();
		const updated: Workflow = {
			...$state.snapshot(workflow),
			nodes: model.nodes,
			edges: model.edges
		} as Workflow;
		workspaceStore.updateWorkflow(updated, { touch });
		appliedAt = updated.updatedAt;
	}

	function addNode(kind: NodeKind, position?: { x: number; y: number }) {
		const def = getNodeDef(kind);
		const at = position ?? screenToFlowPosition({ x: window.innerWidth / 2, y: 300 });
		const node: Node = {
			id: crypto.randomUUID(),
			type: 'dashi',
			position: at,
			data: { kind, label: def.label, config: def.defaultConfig() }
		};
		nodes = [...nodes, node];
		selectedNodeId = node.id;
		persist();
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		const kind = event.dataTransfer?.getData('application/dashi-node') as NodeKind | '';
		if (!kind) return;
		addNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
	}

	function isValidConnection(connection: Connection | Edge): boolean {
		if (connection.source === connection.target) return false;
		const model = currentModel();
		return !wouldCycle({ ...workflow, edges: model.edges }, connection.source, connection.target);
	}

	function onConnect(connection: Connection) {
		// A target handle accepts a single edge; the newest one wins.
		const latest = edges.findLast(
			(edge) =>
				edge.target === connection.target &&
				(edge.targetHandle ?? 'in') === (connection.targetHandle ?? 'in')
		);
		edges = edges.filter(
			(edge) =>
				edge === latest ||
				edge.target !== connection.target ||
				(edge.targetHandle ?? 'in') !== (connection.targetHandle ?? 'in')
		);
		persist();
	}

	let selectedNode = $derived.by(() => {
		const node = nodes.find((n) => n.id === selectedNodeId);
		if (!node) return null;
		return {
			id: node.id,
			kind: node.data.kind as NodeKind,
			label: node.data.label as string,
			position: node.position,
			config: node.data.config as WorkflowNode['config']
		} as WorkflowNode;
	});

	function updateSelectedData(partial: Record<string, unknown>, touch = true) {
		nodes = nodes.map((node) =>
			node.id === selectedNodeId ? { ...node, data: { ...node.data, ...partial } } : node
		);
		persist(touch);
	}

	function updateNodeConfig(nodeId: string, config: WorkflowNode['config']) {
		nodes = nodes.map((node) =>
			node.id === nodeId ? { ...node, data: { ...node.data, config } } : node
		);
		persist();
	}

	function deleteSelected() {
		edges = edges.filter(
			(edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId
		);
		nodes = nodes.filter((node) => node.id !== selectedNodeId);
		selectedNodeId = null;
		persist();
	}

	function addToDashboard(target?: WorkflowNode) {
		const node = target ?? selectedNode;
		if (!node) return;
		const bottom = Math.max(0, ...workspaceStore.widgets.map((x) => x.layout.y + x.layout.h));
		const widget: Widget = {
			id: crypto.randomUUID(),
			title: node.label,
			kind: 'viz',
			layout: {
				x: 0,
				y: bottom,
				w: node.kind === 'metric' ? 3 : 6,
				h: node.kind === 'metric' ? 2 : 4
			},
			config: { workflowId: workflow.id, nodeId: node.id }
		};
		workspaceStore.addWidget(widget);
		toast.success(`“${node.label}” added to the dashboard`);
	}
</script>

<div class="flex h-full min-h-0">
	<NodePalette onAdd={(kind) => addNode(kind)} />
	<div
		class="relative min-w-0 flex-1"
		role="application"
		ondragover={(event) => event.preventDefault()}
		ondrop={onDrop}
	>
		<SvelteFlow
			bind:nodes
			bind:edges
			{nodeTypes}
			{isValidConnection}
			onconnect={onConnect}
			ondelete={() => {
				selectedNodeId = null;
				persist();
			}}
			onnodedragstop={() => persist(false)}
			onnodeclick={({ node }) => (selectedNodeId = node.id)}
			onpaneclick={() => (selectedNodeId = null)}
			fitView
			proOptions={{ hideAttribution: true }}
			deleteKey={['Backspace', 'Delete']}
		>
			<Background variant={BackgroundVariant.Dots} />
			<Controls />
			<MiniMap class="hidden! md:block!" />
		</SvelteFlow>
		{#if !previewOpen}
			<Button
				variant="outline"
				size="sm"
				class="absolute top-2 right-2 z-10 h-7 gap-1 text-xs shadow-sm"
				onclick={() => (previewOpen = true)}
			>
				<ChartLineUpIcon size={13} />
				Preview
			</Button>
		{/if}
	</div>
	{#if selectedNode}
		<NodeConfigPanel
			{workflow}
			node={selectedNode}
			onConfigChange={(config) => updateSelectedData({ config })}
			onLabelChange={(label) => updateSelectedData({ label }, false)}
			onDelete={deleteSelected}
			onAddToDashboard={addToDashboard}
			onClose={() => (selectedNodeId = null)}
		/>
	{/if}
	{#if previewOpen}
		<PreviewPanel
			{workflow}
			onConfigChange={updateNodeConfig}
			onAddToDashboard={(node) => addToDashboard(node)}
			onClose={() => (previewOpen = false)}
		/>
	{/if}
</div>
