<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { loadExampleWorkspace } from '$lib/workspace/example';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DatabaseIcon from 'phosphor-svelte/lib/Database';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';
	import FolderOpenIcon from 'phosphor-svelte/lib/FolderOpen';

	let fileInput: HTMLInputElement | undefined = $state();
	let error = $state<string | null>(null);

	const areas = [
		{
			route: '/data',
			icon: DatabaseIcon,
			title: 'Database client',
			text: 'Browse schemas and write SQL against files, Postgres, MySQL or SQLite.'
		},
		{
			route: '/workflows',
			icon: FlowArrowIcon,
			title: 'Workflows',
			text: 'Build reusable data pipelines with drag and drop nodes.'
		},
		{
			route: '/dashboard',
			icon: SquaresFourIcon,
			title: 'Dashboard',
			text: 'Arrange workflow outputs as widgets on a free grid.'
		}
	] as const;

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

<main class="mx-auto flex min-h-[calc(100vh-2.75rem)] max-w-3xl flex-col justify-center gap-8 p-6">
	<div class="flex flex-col gap-2">
		<h1 class="text-4xl font-semibold tracking-tight">Dashi</h1>
		<p class="text-muted-foreground max-w-lg text-sm">
			Open BI in your browser. Connect data, shape it with visual workflows, and pin the results to
			a dashboard. Powered by DuckDB.
		</p>
	</div>

	<div class="grid gap-3 sm:grid-cols-3">
		{#each areas as area (area.route)}
			<a
				href={resolve(area.route)}
				class="hover:border-primary/50 hover:bg-accent/40 flex flex-col gap-2 rounded-xl border p-4 transition-colors"
			>
				<area.icon size={22} class="text-primary" />
				<p class="text-sm font-medium">{area.title}</p>
				<p class="text-muted-foreground text-xs">{area.text}</p>
			</a>
		{/each}
	</div>

	<div class="flex flex-wrap items-center gap-2">
		<Button onclick={openExample}>
			<SparkleIcon size={16} />
			Load example workspace
		</Button>
		<Button variant="outline" onclick={() => fileInput?.click()}>
			<FolderOpenIcon size={16} />
			Import .dashi file
		</Button>
	</div>
	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{/if}
</main>
