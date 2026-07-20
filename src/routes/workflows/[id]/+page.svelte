<script lang="ts">
	import { page } from '$app/state';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { workflowRuntime } from '$lib/workflow/runtime.svelte';
	import FlowEditor from '$lib/flow/FlowEditor.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import type { WorkflowNode, WorkflowParam } from '$lib/workflow/types';
	import AiAssistantDialog from '$lib/ai/AiAssistantDialog.svelte';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';
	import ArrowLeftIcon from 'phosphor-svelte/lib/ArrowLeft';
	import PlayIcon from 'phosphor-svelte/lib/Play';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import BracketsCurlyIcon from 'phosphor-svelte/lib/BracketsCurly';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import PlusIcon from 'phosphor-svelte/lib/Plus';

	let workflow = $derived(workspaceStore.workflowById(page.params.id ?? ''));
	let runState = $derived(workflow ? workflowRuntime.get(workflow.id) : undefined);
	let running = $derived(runState?.status === 'running');

	function rename(name: string) {
		if (!workflow) return;
		workspaceStore.updateWorkflow({ ...$state.snapshot(workflow), name }, { touch: false });
	}

	function setParams(params: WorkflowParam[]) {
		if (!workflow) return;
		workspaceStore.updateWorkflow({ ...$state.snapshot(workflow), params });
	}

	let aiOpen = $state(false);

	function addAiSqlNode(sql: string, question: string) {
		if (!workflow) return;
		const snapshot = $state.snapshot(workflow);
		const node: WorkflowNode<'sql'> = {
			id: crypto.randomUUID(),
			kind: 'sql',
			label: question.slice(0, 40) || 'AI query',
			position: { x: 80, y: 80 + snapshot.nodes.length * 24 },
			config: { connectionId: '', sql }
		};
		workspaceStore.updateWorkflow({ ...snapshot, nodes: [...snapshot.nodes, node] });
	}
</script>

<svelte:head><title>{workflow?.name ?? 'Workflow'} — Dashi</title></svelte:head>

{#if workflow}
	<div class="flex h-[100vh] flex-col">
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
				<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => (aiOpen = true)}>
					<SparkleIcon size={14} />
					Ask AI
				</Button>
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="h-7 text-xs">
								<BracketsCurlyIcon size={14} />
								Params
								{#if (workflow?.params?.length ?? 0) > 0}
									<span class="text-muted-foreground">({workflow?.params?.length})</span>
								{/if}
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-80 space-y-2" align="end">
						<Label class="text-xs">
							Parameters — use <code class="font-mono">{'{{name}}'}</code> in SQL, formulas and
							filter values.
						</Label>
						{#each workflow?.params ?? [] as param, index (index)}
							<div class="flex items-center gap-1">
								<Input
									value={param.name}
									placeholder="name"
									class="h-8 flex-1 font-mono text-xs"
									onchange={(event) => {
										const params = [...(workflow?.params ?? [])];
										params[index] = {
											...param,
											name: (event.target as HTMLInputElement).value
										};
										setParams(params);
									}}
								/>
								<Input
									value={param.value}
									placeholder="value"
									class="h-8 flex-1 text-xs"
									onchange={(event) => {
										const params = [...(workflow?.params ?? [])];
										params[index] = {
											...param,
											value: (event.target as HTMLInputElement).value
										};
										setParams(params);
									}}
								/>
								<Button
									variant="ghost"
									size="icon"
									class="size-7 shrink-0"
									onclick={() =>
										setParams((workflow?.params ?? []).filter((_, i) => i !== index))}
								>
									<TrashIcon size={12} />
								</Button>
							</div>
						{/each}
						<Button
							variant="outline"
							size="sm"
							class="w-full text-xs"
							onclick={() =>
								setParams([...(workflow?.params ?? []), { name: `param${(workflow?.params?.length ?? 0) + 1}`, value: '' }])}
						>
							<PlusIcon size={12} />
							Add parameter
						</Button>
					</Popover.Content>
				</Popover.Root>
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
	<AiAssistantDialog bind:open={aiOpen} onAccept={addAiSqlNode} />
{:else if workspaceStore.loaded}
	<main
		class="text-muted-foreground flex h-[100vh] flex-col items-center justify-center gap-3 text-sm"
	>
		<p>Workflow not found.</p>
		<Button variant="outline" href="/workflows">Back to workflows</Button>
	</main>
{/if}
