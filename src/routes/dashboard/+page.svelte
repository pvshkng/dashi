<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import Dashboard from '$lib/dashboard/Dashboard.svelte';
	import AddWidgetDialog from '$lib/dashboard/AddWidgetDialog.svelte';
	import MenuBar from '$lib/components/dock/MenuBar.svelte';
	import { innerWidth } from 'svelte/reactivity/window';

	let editable = $state(false);
	let mobilePreview = $state(false);
	let addOpen = $state(false);

	// Small viewports always get the responsive stacked layout.
	let isNarrow = $derived((innerWidth.current ?? 1200) < 768);
	let mobile = $derived(mobilePreview || isNarrow);
</script>

<svelte:head><title>Dashboard — Dashi</title></svelte:head>

<div
	class="min-h-[calc(100vh-2.75rem)]"
	style={workspaceStore.settings.backgroundColor
		? `background-color: ${workspaceStore.settings.backgroundColor}`
		: ''}
>
	<main class="p-4 pb-24">
		<Dashboard
			colorScheme={workspaceStore.settings.colorScheme}
			showGrid={workspaceStore.settings.showGrid}
			widgets={workspaceStore.widgets}
			editable={editable && !mobile}
			{mobile}
			onUpdateWidget={(widget) => workspaceStore.updateWidget(widget)}
			onRemoveWidget={(widgetId) => workspaceStore.removeWidget(widgetId)}
		/>
		{#if workspaceStore.loaded && workspaceStore.widgets.length === 0}
			<div class="text-muted-foreground absolute inset-0 flex items-center justify-center">
				<p class="text-sm">
					{editable
						? 'Empty dashboard — use Add widget below to pin workflow outputs here.'
						: 'Empty dashboard — switch to edit mode to add widgets.'}
				</p>
			</div>
		{/if}
	</main>
</div>

<AddWidgetDialog bind:open={addOpen} />
<MenuBar bind:editable bind:mobilePreview onAddWidget={() => (addOpen = true)} />
