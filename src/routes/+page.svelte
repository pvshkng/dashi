<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { windowManager, type WindowOptions } from '$lib/windows/manager.svelte';
	import FloatingWindow from '$lib/windows/FloatingWindow.svelte';
	import DataApp from '$lib/apps/DataApp.svelte';
	import WorkflowsApp from '$lib/apps/WorkflowsApp.svelte';
	import DashboardsApp from '$lib/apps/DashboardsApp.svelte';
	import ReportsApp from '$lib/apps/ReportsApp.svelte';
	import NotebookIcon from 'phosphor-svelte/lib/Notebook';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { loadExampleWorkspace } from '$lib/workspace/example';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';
	import DatabaseIcon from 'phosphor-svelte/lib/Database';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';
	import PlugsIcon from 'phosphor-svelte/lib/Plugs';
	import GearSixIcon from 'phosphor-svelte/lib/GearSix';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';
	import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpen';
	import HandWavingIcon from 'phosphor-svelte/lib/HandWaving';

	interface DesktopApp {
		id: string;
		label: string;
		icon: typeof DatabaseIcon;
		window: WindowOptions;
	}

	const mainApps: DesktopApp[] = [
		{
			id: 'data',
			label: 'Data Studio',
			icon: DatabaseIcon,
			window: { x: 90, y: 90, width: 980, height: 620 }
		},
		{
			id: 'workflows',
			label: 'Workflows',
			icon: FlowArrowIcon,
			window: { x: 130, y: 110, width: 900, height: 640 }
		},
		{
			id: 'dashboards',
			label: 'Dashboards',
			icon: SquaresFourIcon,
			window: { x: 170, y: 130, width: 940, height: 640 }
		},
		{
			id: 'reports',
			label: 'Reports',
			icon: NotebookIcon,
			window: { x: 200, y: 140, width: 920, height: 640 }
		},
		{
			id: 'datasets',
			label: 'Datasets',
			icon: DownloadSimpleIcon,
			window: { x: 210, y: 120, width: 460, height: 600 }
		}
	];

	const sideApps: DesktopApp[] = [
		{ id: 'connections', label: 'Connections', icon: PlugsIcon, window: {} },
		{ id: 'settings', label: 'Settings', icon: GearSixIcon, window: {} },
		{ id: 'welcome', label: 'Welcome', icon: HandWavingIcon, window: { x: 0, y: 0 } }
	];

	let fileInput: HTMLInputElement | undefined = $state();
	let error = $state<string | null>(null);

	function openApp(app: DesktopApp) {
		windowManager.open(app.id, app.id === 'welcome' ? welcomeOptions() : app.window);
	}

	onMount(() => {
		if (!sessionStorage.getItem('dashi:welcomed')) {
			sessionStorage.setItem('dashi:welcomed', '1');
			windowManager.open('welcome', welcomeOptions());
		}
	});

	function welcomeOptions(): WindowOptions {
		const width = Math.min(620, window.innerWidth - 32);
		return {
			width,
			height: 480,
			x: Math.max(16, (window.innerWidth - width) / 2),
			y: Math.max(60, (window.innerHeight - 480) / 2 - 20)
		};
	}

	async function onFileChosen(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;
		error = null;
		try {
			await workspaceStore.importFile(file);
			goto(resolve('/dashboard'));
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to import file.';
		}
		if (fileInput) fileInput.value = '';
	}

	async function openExample() {
		await loadExampleWorkspace();
		goto(resolve('/dashboard'));
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

{#snippet desktopIcon(app: DesktopApp)}
	<button
		type="button"
		class="group flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 outline-none focus-visible:ring-2"
		onclick={() => openApp(app)}
	>
		<span
			class={cn(
				'bg-background/70 flex size-14 items-center justify-center rounded-2xl border shadow-sm backdrop-blur-md transition-transform group-hover:scale-105 group-active:scale-95',
				windowManager.isOpen(app.id) && 'ring-primary/40 ring-2'
			)}
		>
			<app.icon size={26} class="text-primary" />
		</span>
		<span
			class="bg-background/60 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm"
		>
			{app.label}
		</span>
	</button>
{/snippet}

<div class="desktop relative h-screen overflow-hidden">
	<div class="pointer-events-none absolute inset-0 select-none">
		<p
			class="text-foreground/5 absolute right-6 bottom-14 text-[7rem] leading-none font-bold tracking-tighter"
		>
			dashi
		</p>
	</div>

	<div class="absolute top-6 left-4 flex flex-col gap-2">
		{#each mainApps as app (app.id)}
			{@render desktopIcon(app)}
		{/each}
	</div>

	<div class="absolute top-6 right-4 flex flex-col gap-2">
		{#each sideApps as app (app.id)}
			{@render desktopIcon(app)}
		{/each}
	</div>

	<div class="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
		<div
			class="bg-background/60 pointer-events-auto flex items-center gap-1 rounded-2xl border px-2 py-1.5 shadow-xl ring-1 ring-black/5 backdrop-blur-2xl"
		>
			{#each [...mainApps, ...sideApps] as app (app.id)}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<button
								{...props}
								type="button"
								class="hover:bg-accent relative flex size-10 items-center justify-center rounded-xl transition-transform hover:-translate-y-0.5 active:scale-95"
								onclick={() =>
									windowManager.isOpen(app.id) ? windowManager.close(app.id) : openApp(app)}
							>
								<app.icon size={20} class="text-primary" />
								{#if windowManager.isOpen(app.id)}
									<span class="bg-primary absolute -bottom-0.5 size-1 rounded-full"></span>
								{/if}
							</button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content side="top">{app.label}</Tooltip.Content>
				</Tooltip.Root>
			{/each}
			<Separator orientation="vertical" class="mx-1 h-6!" />
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<a
							{...props}
							href={resolve('/dashboard')}
							class="hover:bg-accent text-muted-foreground hover:text-foreground flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors"
						>
							{workspaceStore.settings.name}
						</a>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top">Open the dashboard canvas</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>

	<FloatingWindow id="data" title="Data Studio" icon={DatabaseIcon}>
		<div class="h-full">
			<DataApp />
		</div>
	</FloatingWindow>

	<FloatingWindow id="workflows" title="Workflows" icon={FlowArrowIcon}>
		<WorkflowsApp />
	</FloatingWindow>

	<FloatingWindow id="dashboards" title="Dashboards" icon={SquaresFourIcon}>
		<DashboardsApp />
	</FloatingWindow>

	<FloatingWindow id="reports" title="Reports" icon={NotebookIcon}>
		<ReportsApp />
	</FloatingWindow>

	<FloatingWindow id="welcome" title="Welcome to Dashi" icon={HandWavingIcon} dockable={false}>
		<div class="flex h-full flex-col gap-4 p-5">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">Open BI in your browser</h1>
				<p class="text-muted-foreground mt-1 max-w-md text-sm">
					Connect data, shape it with visual workflows, and pin the results to a dashboard.
					Everything runs locally, powered by DuckDB.
				</p>
			</div>
			<div class="grid gap-2 sm:grid-cols-3">
				{#each mainApps.slice(0, 3) as app (app.id)}
					<button
						type="button"
						class="hover:border-primary/50 hover:bg-accent/40 flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors"
						onclick={() => openApp(app)}
					>
						<app.icon size={20} class="text-primary" />
						<p class="text-sm font-medium">{app.label}</p>
						<p class="text-muted-foreground text-xs">
							{app.id === 'data'
								? 'Browse schemas and write SQL against files or servers.'
								: app.id === 'workflows'
									? 'Build charts from templates or drag and drop nodes.'
									: 'Load a prebuilt dashboard with real open data.'}
						</p>
					</button>
				{/each}
			</div>
			<div class="mt-auto flex flex-wrap items-center gap-2">
				<Button onclick={openExample}>
					<SparkleIcon size={16} />
					Load example workspace
				</Button>
				<Button variant="outline" onclick={() => fileInput?.click()}>
					<FolderOpenIcon size={16} />
					Import .dashi file
				</Button>
				<Button
					variant="ghost"
					onclick={() => windowManager.open('datasets', { width: 460, height: 600 })}
				>
					<DownloadSimpleIcon size={16} />
					Browse sample data
				</Button>
			</div>
			{#if error}
				<p class="text-destructive text-sm">{error}</p>
			{/if}
		</div>
	</FloatingWindow>
</div>

<style>
	.desktop {
		background:
			radial-gradient(1000px 500px at 15% -10%, oklch(0.92 0.05 250 / 0.5), transparent 60%),
			radial-gradient(900px 500px at 90% 15%, oklch(0.93 0.05 150 / 0.45), transparent 55%),
			radial-gradient(800px 600px at 50% 110%, oklch(0.92 0.06 40 / 0.4), transparent 60%),
			radial-gradient(oklch(0.75 0.02 250 / 0.35) 1px, transparent 1px);
		background-size:
			auto,
			auto,
			auto,
			22px 22px;
	}
	:global(.dark) .desktop {
		background:
			radial-gradient(1000px 500px at 15% -10%, oklch(0.35 0.08 260 / 0.5), transparent 60%),
			radial-gradient(900px 500px at 90% 15%, oklch(0.32 0.06 170 / 0.45), transparent 55%),
			radial-gradient(800px 600px at 50% 110%, oklch(0.3 0.07 40 / 0.4), transparent 60%),
			radial-gradient(oklch(0.5 0.02 250 / 0.3) 1px, transparent 1px);
		background-size:
			auto,
			auto,
			auto,
			22px 22px;
	}
</style>
