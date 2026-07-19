<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import VizRenderer from './VizRenderer.svelte';
	import type { VizWidget } from './types';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';

	let { widget }: { widget: VizWidget } = $props();

	let workflow = $derived(workspaceStore.workflowById(widget.config.workflowId));
	let node = $derived(workflow?.nodes.find((n) => n.id === widget.config.nodeId));
	let runState = $derived(workflow ? workflowRuntime.get(workflow.id) : undefined);
	let result = $derived(runState?.run?.results[widget.config.nodeId]);

	$effect(() => {
		if (workflow && node) {
			void workflow.updatedAt;
			workflowRuntime.ensure(workflow);
		}
	});
</script>

{#if !workflow || !node}
	<p class="text-muted-foreground p-2 text-sm">The workflow behind this widget was removed.</p>
{:else if runState?.status === 'running' && !result}
	<div class="text-muted-foreground flex h-full items-center justify-center">
		<CircleNotchIcon size={18} class="animate-spin" />
	</div>
{:else if runState?.run?.error}
	<p class="text-destructive p-2 text-sm">{runState.run.error}</p>
{:else if result}
	<VizRenderer {node} {result} />
{:else}
	<p class="text-muted-foreground p-2 text-sm">No data yet — run the workflow.</p>
{/if}
