<script lang="ts">
	import { page } from '$app/state';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import FlowEditor from '$lib/flow/FlowEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeft';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';

	let workflow = $derived(workspaceStore.workflowById(page.params.id ?? ''));
	let runState = $derived(workflow ? workflowRuntime.get(workflow.id) : undefined);
	let running = $derived(runState?.status === 'running');

	function rename(name: string) {
		if (!workflow) return;
		workspaceStore.updateWorkflow({ ...$state.snapshot(workflow), name }, { touch: false });
	}
</script>

<svelte:head><title>{workflow?.name ?? 'Workflow'} — Dashi</title></svelte:head>

{#if workflow}
	<div class="flex h-[calc(100vh-2.75rem)] flex-col">
		<div class="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
			<Button variant="ghost" size="icon" class="size-7" href="/workflows" title="All workflows">
				<ArrowLeftIcon size={15} />
			</Button>
			<Input
				value={workflow.name}
				class="h-7 w-64 border-transparent text-sm font-medium shadow-none focus-visible:border-input"
				onchange={(event) => rename((event.target as HTMLInputElement).value)}
			/>
			<div class="ml-auto flex items-center gap-2">
				{#if runState?.finishedAt}
					<span class="text-muted-foreground text-xs">
						Last run {new Date(runState.finishedAt).toLocaleTimeString()}
					</span>
				{/if}
				<Button
					size="sm"
					class="h-7 text-xs"
					disabled={running}
					onclick={() => workflowRuntime.run(workflow)}
				>
					{#if running}
						<CircleNotchIcon size={14} class="animate-spin" />
						Running…
					{:else}
						<PlayIcon size={14} />
						Run
					{/if}
				</Button>
			</div>
		</div>
		<div class="min-h-0 flex-1">
			<SvelteFlowProvider>
				<FlowEditor {workflow} />
			</SvelteFlowProvider>
		</div>
	</div>
{:else if workspaceStore.loaded}
	<main
		class="text-muted-foreground flex h-[calc(100vh-2.75rem)] flex-col items-center justify-center gap-3 text-sm"
	>
		<p>Workflow not found.</p>
		<Button variant="outline" href="/workflows">Back to workflows</Button>
	</main>
{/if}
