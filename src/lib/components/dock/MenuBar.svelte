<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { loadExampleWorkspace } from '$lib/workspace/example';
	import { dashboardPresets, loadDashboardPreset } from '$lib/workspace/prebuilt';
	import type { DashboardPreset } from '$lib/workspace/prebuilt';
	import { windowManager } from '$lib/windows/manager.svelte';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import EyeIcon from 'phosphor-svelte/lib/Eye';
	import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimple';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import DesktopIcon from 'phosphor-svelte/lib/Desktop';
	import DeviceMobileIcon from 'phosphor-svelte/lib/DeviceMobile';

	let {
		editable = $bindable(false),
		mobilePreview = $bindable(false),
		onAddWidget
	}: {
		editable?: boolean;
		mobilePreview?: boolean;
		onAddWidget: () => void;
	} = $props();

	let fileInput: HTMLInputElement | undefined = $state();

	async function onFileChosen(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) await workspaceStore.importFile(file);
		if (fileInput) fileInput.value = '';
	}

	async function loadPreset(preset: DashboardPreset) {
		if (
			workspaceStore.widgets.length > 0 &&
			!confirm(`Load “${preset.name}”? This replaces the current dashboard widgets.`)
		) {
			return;
		}
		try {
			await loadDashboardPreset(preset);
			toast.success(`Loaded “${preset.name}”`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not load the dashboard data.');
		}
	}
</script>

<input
	bind:this={fileInput}
	type="file"
	accept=".dashi,application/json"
	class="hidden"
	onchange={onFileChosen}
/>

<div class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center">
	<div
		class="bg-background/60 pointer-events-auto flex items-center gap-1 rounded-2xl border px-2 py-1 shadow-xl ring-1 ring-black/5 backdrop-blur-2xl"
		style="padding-bottom: max(0.25rem, env(safe-area-inset-bottom) / 2)"
	>
		<Menubar.Root class="border-none bg-transparent shadow-none">
			<Menubar.Menu>
				<Menubar.Trigger>File</Menubar.Trigger>
				<Menubar.Content side="top" align="start">
					<Menubar.Item onclick={() => workspaceStore.exportFile()}>Export .dashi</Menubar.Item>
					<Menubar.Item onclick={() => fileInput?.click()}>Import .dashi…</Menubar.Item>
					<Menubar.Separator />
					<Menubar.Item onclick={() => loadExampleWorkspace()}>Load example</Menubar.Item>
				</Menubar.Content>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger>Dashboards</Menubar.Trigger>
				<Menubar.Content side="top" align="start" class="w-64">
					<Menubar.GroupHeading>Prebuilt dashboards</Menubar.GroupHeading>
					{#each dashboardPresets as preset (preset.id)}
						<Menubar.Item onclick={() => loadPreset(preset)}>
							<div class="min-w-0">
								<p class="text-sm">{preset.name}</p>
								<p class="text-muted-foreground truncate text-xs">{preset.tagline}</p>
							</div>
						</Menubar.Item>
					{/each}
				</Menubar.Content>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger>Windows</Menubar.Trigger>
				<Menubar.Content side="top" align="start">
					<Menubar.CheckboxItem
						checked={windowManager.windows.connections.open}
						onclick={() => windowManager.toggle('connections')}
					>
						Connections
					</Menubar.CheckboxItem>
					<Menubar.CheckboxItem
						checked={windowManager.windows.settings.open}
						onclick={() => windowManager.toggle('settings')}
					>
						Dashboard settings
					</Menubar.CheckboxItem>
				</Menubar.Content>
			</Menubar.Menu>
		</Menubar.Root>

		{#if editable}
			<Button variant="ghost" size="sm" class="h-7 gap-1 px-2 text-xs" onclick={onAddWidget}>
				<PlusIcon size={14} />
				Add widget
			</Button>
		{/if}

		<Separator orientation="vertical" class="mx-1 h-5!" />
		<span class="text-muted-foreground max-w-40 truncate px-1 text-xs">
			{workspaceStore.settings.name}
		</span>

		<div class="bg-muted flex items-center rounded-full p-0.5">
			<Button
				variant="ghost"
				size="icon"
				class={cn('size-7 rounded-full', !mobilePreview && 'bg-background shadow-sm')}
				title="Desktop layout"
				onclick={() => (mobilePreview = false)}
			>
				<DesktopIcon size={14} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class={cn('size-7 rounded-full', mobilePreview && 'bg-background shadow-sm')}
				title="Mobile layout"
				onclick={() => (mobilePreview = true)}
			>
				<DeviceMobileIcon size={14} />
			</Button>
		</div>

		<div class="bg-muted flex items-center rounded-full p-0.5">
			<Button
				variant="ghost"
				size="icon"
				class={cn('size-7 rounded-full', !editable && 'bg-background shadow-sm')}
				title="View mode"
				onclick={() => (editable = false)}
			>
				<EyeIcon size={14} weight={!editable ? 'fill' : 'regular'} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				class={cn('size-7 rounded-full', editable && 'bg-background shadow-sm')}
				title="Edit mode"
				onclick={() => (editable = true)}
			>
				<PencilSimpleIcon size={14} weight={editable ? 'fill' : 'regular'} />
			</Button>
		</div>
	</div>
</div>
