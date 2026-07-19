<script lang="ts">
	import { dashboardPresets, loadDashboardPreset, presetThumbs } from '$lib/workspace/prebuilt';
	import type { DashboardPreset } from '$lib/workspace/prebuilt';
	import { getDashboardTheme, themeStyle } from '$lib/dashboard/themes';
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import TemplateThumb from '$lib/charts/TemplateThumb.svelte';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import ArrowRightIcon from 'phosphor-svelte/lib/ArrowRight';

	let busy = $state<string | null>(null);

	async function load(preset: DashboardPreset) {
		if (
			workspaceStore.widgets.length > 0 &&
			!confirm(`Load “${preset.name}”? This replaces the current dashboard widgets.`)
		) {
			return;
		}
		busy = preset.id;
		try {
			await loadDashboardPreset(preset);
			toast.success(`Loaded “${preset.name}”`);
			goto(resolve('/dashboard'));
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not load the dashboard data.');
		} finally {
			busy = null;
		}
	}
</script>

<div class="mx-auto max-w-5xl space-y-6 p-6">
	<div class="flex items-end justify-between gap-2">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Dashboards</h1>
			<p class="text-muted-foreground text-sm">
				Themed starter boards with bundled mock data, plus prebuilt boards with real open data.
				Loading replaces the current dashboard.
			</p>
		</div>
		<Button variant="outline" size="sm" class="h-8 gap-1 text-xs" href={resolve('/dashboard')}>
			Open current
			<ArrowRightIcon size={13} />
		</Button>
	</div>

	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each dashboardPresets as preset (preset.id)}
			<div
				class="group hover:border-primary/50 flex flex-col overflow-hidden rounded-xl border transition-colors"
			>
				<div
					class="bg-muted/40 relative grid h-36 grid-cols-12 gap-1 border-b p-2"
					style={preset.theme ? themeStyle(getDashboardTheme(preset.theme)) : ''}
				>
					{#each presetThumbs(preset) as tile, i (i)}
						<div
							class="bg-background/80 flex items-center justify-center overflow-hidden rounded-md border p-1"
							style={`grid-column: ${tile.layout.x + 1} / span ${tile.layout.w};${
								preset.theme
									? ' background: var(--dash-card-bg); border-color: var(--dash-card-border); box-shadow: var(--dash-card-shadow);'
									: ''
							}`}
						>
							<TemplateThumb kind={tile.kind} class="opacity-80" />
						</div>
					{/each}
					{#if preset.theme}
						<span
							class="absolute right-2 bottom-2 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm"
							style="background: var(--dash-card-bg); border-color: var(--dash-card-border); box-shadow: var(--dash-card-shadow);"
						>
							{getDashboardTheme(preset.theme).name}
						</span>
					{/if}
				</div>
				<div class="flex flex-1 flex-col gap-1 p-3">
					<p class="text-sm font-medium">{preset.name}</p>
					<p class="text-primary text-xs">{preset.tagline}</p>
					<p class="text-muted-foreground line-clamp-2 text-xs">{preset.description}</p>
					<div class="mt-2 flex items-center gap-2">
						<Button
							size="sm"
							class="h-7 gap-1 text-xs"
							disabled={busy !== null}
							onclick={() => load(preset)}
						>
							{#if busy === preset.id}
								<CircleNotchIcon size={12} class="animate-spin" />
							{:else}
								<SquaresFourIcon size={12} />
							{/if}
							Load dashboard
						</Button>
						<span class="text-muted-foreground text-[10px]">
							{preset.items.length} widgets
						</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
