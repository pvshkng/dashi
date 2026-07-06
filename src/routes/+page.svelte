<script lang="ts">
	import { dashiStore } from '$lib/dashi/store.svelte';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import Dashboard from '$lib/dashboard/Dashboard.svelte';
	import MenuBar from '$lib/components/dock/MenuBar.svelte';
	import FloatingWindow from '$lib/windows/FloatingWindow.svelte';
	import SqlPanel from '$lib/panels/SqlPanel.svelte';
	import ConnectionsPanel from '$lib/panels/ConnectionsPanel.svelte';
	import SettingsPanel from '$lib/panels/SettingsPanel.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpen';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';
	import TerminalIcon from 'phosphor-svelte/lib/Terminal';
	import PlugsIcon from 'phosphor-svelte/lib/Plugs';
	import GearSixIcon from 'phosphor-svelte/lib/GearSix';

	let fileInput: HTMLInputElement | undefined = $state();
	let dragOver = $state(false);

	onMount(() => {
		if (!connectionsStore.loaded) {
			connectionsStore.load().then(() => connectionsStore.reregisterFileConnections());
		}
		if (!dashiStore.loaded) {
			dashiStore.init();
		}
	});

	function onFileChosen(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) dashiStore.openFile(file);
		if (fileInput) fileInput.value = '';
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		const file = event.dataTransfer?.files?.[0];
		if (file && file.name.endsWith('.dashi')) dashiStore.openFile(file);
	}
</script>

<svelte:head><title>Dashi</title></svelte:head>

<input
	bind:this={fileInput}
	type="file"
	accept=".dashi,application/json"
	class="hidden"
	onchange={onFileChosen}
/>

<div
	class="relative min-h-screen"
	style={dashiStore.doc?.background.color
		? `background-color: ${dashiStore.doc.background.color}`
		: ''}
	role="application"
	ondragover={(event) => {
		event.preventDefault();
		dragOver = true;
	}}
	ondragleave={() => (dragOver = false)}
	ondrop={onDrop}
>
	{#if dashiStore.doc}
		<main class="p-4 pb-24">
			<Dashboard
				colorScheme={dashiStore.doc.colorScheme}
				background={dashiStore.doc.background}
				widgets={dashiStore.doc.widgets}
				connections={connectionsStore.connections}
				editable={dashiStore.mode === 'edit'}
				onUpdateWidget={(widget) => dashiStore.updateWidget(widget)}
				onRemoveWidget={(widgetId) => dashiStore.removeWidget(widgetId)}
			/>
			{#if dashiStore.doc.widgets.length === 0}
				<div class="text-muted-foreground absolute inset-0 flex items-center justify-center">
					<p class="text-sm">
						{dashiStore.mode === 'edit'
							? 'Empty dashboard — use the Add menu below to add widgets.'
							: 'Empty dashboard — switch to edit mode to add widgets.'}
					</p>
				</div>
			{/if}
		</main>
	{:else if dashiStore.loaded}
		<main class="flex min-h-screen flex-col items-center justify-center gap-6 p-6 pb-24">
			<div class="flex flex-col items-center gap-2 text-center">
				<h1 class="text-4xl font-semibold tracking-tight">Dashi</h1>
				<p class="text-muted-foreground max-w-md text-sm">
					Client-side BI powered by DuckDB in your browser. Open a
					<span class="text-foreground font-medium">.dashi</span> dashboard file to get started, or explore
					the example.
				</p>
			</div>
			<div class="flex flex-wrap items-center justify-center gap-2">
				<Button onclick={() => fileInput?.click()}>
					<FolderOpenIcon size={16} />
					Open .dashi file
				</Button>
				<Button variant="outline" onclick={() => dashiStore.openExample()}>
					<SparkleIcon size={16} />
					Open example dashboard
				</Button>
			</div>
			{#if dashiStore.error}
				<p class="text-destructive text-sm">{dashiStore.error}</p>
			{/if}
			<p class="text-muted-foreground text-xs">…or drop a .dashi file anywhere</p>
		</main>
	{/if}

	{#if dragOver}
		<div
			class="border-primary bg-primary/5 pointer-events-none fixed inset-3 z-30 rounded-2xl border-2 border-dashed"
		></div>
	{/if}
</div>

<FloatingWindow id="sql" title="SQL editor" icon={TerminalIcon}>
	<SqlPanel />
</FloatingWindow>
<FloatingWindow id="connections" title="Connections" icon={PlugsIcon}>
	<ConnectionsPanel />
</FloatingWindow>
<FloatingWindow id="settings" title="Settings" icon={GearSixIcon}>
	<SettingsPanel />
</FloatingWindow>

<MenuBar />
