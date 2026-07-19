<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { ModeWatcher } from 'mode-watcher';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Toaster } from '$lib/components/ui/sonner';
	import FloatingWindow from '$lib/windows/FloatingWindow.svelte';
	import ConnectionsPanel from '$lib/panels/ConnectionsPanel.svelte';
	import SettingsPanel from '$lib/panels/SettingsPanel.svelte';
	import SampleDataPanel from '$lib/panels/SampleDataPanel.svelte';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { reseedExampleIfPresent } from '$lib/workspace/example';
	import { onMount } from 'svelte';
	import PlugsIcon from 'phosphor-svelte/lib/Plugs';
	import GearSixIcon from 'phosphor-svelte/lib/GearSix';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';

	let { children } = $props();

	onMount(async () => {
		if (!connectionsStore.loaded) {
			await connectionsStore.load();
			await connectionsStore.reregisterFileConnections();
		}
		await workspaceStore.init();
		await reseedExampleIfPresent();
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher defaultMode="light" track={false} />

<Tooltip.Provider>
	<Toaster />
	{@render children()}

	<FloatingWindow id="connections" title="Connections" icon={PlugsIcon}>
		<ConnectionsPanel />
	</FloatingWindow>
	<FloatingWindow id="settings" title="Dashboard settings" icon={GearSixIcon}>
		<SettingsPanel />
	</FloatingWindow>
	<FloatingWindow id="datasets" title="Datasets" icon={DownloadSimpleIcon}>
		<SampleDataPanel />
	</FloatingWindow>
</Tooltip.Provider>
