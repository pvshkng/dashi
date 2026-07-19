<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import { getContext } from 'svelte';
	import { getNodeDef } from '$lib/workflow/defs';
	import type { NodeKind, WorkflowNode } from '$lib/workflow/types';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import VizRenderer from '$lib/widgets/VizRenderer.svelte';
	import { nodeIcons } from './icons';
	import { cn } from '$lib/utils';
	import WarningCircleIcon from 'phosphor-svelte/lib/WarningCircle';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';

	let { id, data, selected }: NodeProps = $props();

	const workflowId = getContext<() => string>('dashi:workflowId');

	let kind = $derived(data.kind as NodeKind);
	let label = $derived(data.label as string);
	let def = $derived(getNodeDef(kind));
	let Icon = $derived(nodeIcons[kind]);

	let runState = $derived(workflowRuntime.get(workflowId()));
	let result = $derived(runState?.run?.results[id]);
	let running = $derived(runState?.status === 'running');
	let isViz = $derived(def.category === 'output');

	let workflowNode = $derived({
		id,
		kind,
		label,
		position: { x: 0, y: 0 },
		config: data.config
	} as WorkflowNode);
</script>

<div
	class={cn(
		'bg-background/90 w-56 rounded-xl border shadow-sm backdrop-blur transition-shadow',
		selected && 'ring-primary ring-2',
		result?.error && 'border-destructive/60'
	)}
>
	{#each def.inputs as input, index (input.id)}
		<Handle
			type="target"
			id={input.id}
			position={Position.Left}
			style={`top: ${def.inputs.length === 1 ? 50 : 30 + index * 40}%`}
		/>
	{/each}
	{#if def.hasOutput}
		<Handle type="source" position={Position.Right} />
	{/if}

	<div class="flex items-center gap-2 px-3 py-2">
		<span
			class={cn(
				'flex size-7 shrink-0 items-center justify-center rounded-lg',
				def.category === 'source' && 'bg-blue-500/10 text-blue-600',
				def.category === 'transform' && 'bg-violet-500/10 text-violet-600',
				def.category === 'output' && 'bg-emerald-500/10 text-emerald-600'
			)}
		>
			<Icon size={16} />
		</span>
		<div class="min-w-0">
			<p class="truncate text-xs font-medium">{label}</p>
			<p class="text-muted-foreground text-[10px]">{def.label}</p>
		</div>
	</div>

	{#if isViz && result && !result.error}
		<div class="pointer-events-none h-28 overflow-hidden border-t px-1 py-1 text-[10px]">
			<VizRenderer node={workflowNode} {result} />
		</div>
	{/if}

	<div
		class={cn(
			'text-muted-foreground flex items-center gap-1 border-t px-3 py-1 text-[10px]',
			result?.error && 'text-destructive'
		)}
	>
		{#if running}
			<CircleNotchIcon size={10} class="animate-spin" />
			Running…
		{:else if result?.error}
			<WarningCircleIcon size={10} />
			<span class="truncate" title={result.error}>{result.error}</span>
		{:else if result}
			{result.rowCount.toLocaleString()} rows · {result.columns.length} cols
		{:else}
			Not run yet
		{/if}
	</div>
</div>
