<script lang="ts">
	import { tick } from 'svelte';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import Dashboard from '$lib/dashboard/Dashboard.svelte';
	import AddWidgetDialog from '$lib/dashboard/AddWidgetDialog.svelte';
	import MenuBar from '$lib/components/dock/MenuBar.svelte';
	import { innerWidth } from 'svelte/reactivity/window';
	import { getDashboardTheme, themeStyle } from '$lib/dashboard/themes';
	import XIcon from 'phosphor-svelte/lib/X';

	let editable = $state(false);
	let mobilePreview = $state(false);
	let addOpen = $state(false);
	let presenting = $state(false);
	let presentEl = $state<HTMLDivElement>();

	// Small viewports always get the responsive stacked layout.
	let isNarrow = $derived((innerWidth.current ?? 1200) < 768);
	let mobile = $derived(mobilePreview || isNarrow);

	async function startPresenting() {
		presenting = true;
		await tick();
		try {
			await presentEl?.requestFullscreen();
		} catch {
			// Fullscreen can be denied; the overlay still covers the viewport.
		}
	}

	function stopPresenting() {
		presenting = false;
		if (document.fullscreenElement) void document.exitFullscreen();
	}

	function onFullscreenChange() {
		if (!document.fullscreenElement && presenting) presenting = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && presenting) stopPresenting();
	}

	let theme = $derived(getDashboardTheme(workspaceStore.settings.theme));
	let canvasStyle = $derived(themeStyle(theme, workspaceStore.settings.backgroundColor));
</script>

<svelte:head><title>Dashboard — Dashi</title></svelte:head>
<svelte:document onfullscreenchange={onFullscreenChange} />
<svelte:window onkeydown={onKeydown} />

<div class="min-h-[100vh]" style={canvasStyle}>
	<main class="p-4 pb-24">
		<Dashboard
			colorScheme={workspaceStore.settings.colorScheme}
			showGrid={workspaceStore.settings.showGrid}
			layoutMode={workspaceStore.settings.layoutMode}
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

{#if presenting}
	<div
		bind:this={presentEl}
		class="bg-background fixed inset-0 z-80 overflow-auto"
		style={canvasStyle}
	>
		<main class="p-8">
			<Dashboard
				colorScheme={workspaceStore.settings.colorScheme}
				showGrid={false}
				layoutMode={workspaceStore.settings.layoutMode}
				widgets={workspaceStore.widgets}
				editable={false}
				mobile={false}
				onUpdateWidget={(widget) => workspaceStore.updateWidget(widget)}
				onRemoveWidget={(widgetId) => workspaceStore.removeWidget(widgetId)}
			/>
		</main>
		<button
			type="button"
			class="bg-background/60 text-muted-foreground hover:text-foreground fixed top-4 right-4 rounded-full border p-2 opacity-30 shadow-sm backdrop-blur-md transition-opacity hover:opacity-100"
			title="Exit presentation (Esc)"
			aria-label="Exit presentation"
			onclick={stopPresenting}
		>
			<XIcon size={16} />
		</button>
	</div>
{:else}
	<AddWidgetDialog bind:open={addOpen} />
	<MenuBar
		bind:editable
		bind:mobilePreview
		onAddWidget={() => (addOpen = true)}
		onPresent={startPresenting}
	/>
{/if}
