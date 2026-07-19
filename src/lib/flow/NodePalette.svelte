<script lang="ts">
	import { categoryLabels, categoryOrder, nodeDefs } from '$lib/workflow/defs';
	import type { NodeKind } from '$lib/workflow/types';
	import { nodeIcons } from './icons';

	let { onAdd }: { onAdd: (kind: NodeKind) => void } = $props();

	let grouped = $derived(
		categoryOrder.map((category) => ({
			category,
			defs: Object.values(nodeDefs).filter((def) => def.category === category)
		}))
	);

	function onDragStart(event: DragEvent, kind: NodeKind) {
		event.dataTransfer?.setData('application/dashi-node', kind);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}
</script>

<div class="flex h-full w-52 shrink-0 flex-col gap-3 overflow-auto border-r p-3">
	{#each grouped as group (group.category)}
		<div class="space-y-1">
			<p class="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
				{categoryLabels[group.category]}
			</p>
			{#each group.defs as def (def.kind)}
				{@const Icon = nodeIcons[def.kind]}
				<button
					type="button"
					class="hover:bg-accent flex w-full cursor-grab items-center gap-2 rounded-lg border px-2 py-1.5 text-left active:cursor-grabbing"
					draggable="true"
					title={`${def.description} — drag onto the canvas or click to add`}
					ondragstart={(event) => onDragStart(event, def.kind)}
					onclick={() => onAdd(def.kind)}
				>
					<Icon size={14} class="text-muted-foreground shrink-0" />
					<span class="truncate text-xs">{def.label}</span>
				</button>
			{/each}
		</div>
	{/each}
</div>
