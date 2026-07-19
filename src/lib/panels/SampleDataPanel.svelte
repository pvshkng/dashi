<script lang="ts">
	import {
		sampleDatasets,
		sampleCategories,
		installSampleDataset,
		isSampleInstalled,
		sampleConnectionId,
		type SampleCategory,
		type SampleDataset
	} from '$lib/data/sampleDatasets';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	import DownloadSimpleIcon from 'phosphor-svelte/lib/DownloadSimple';
	import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircle';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';
	import TrashIcon from 'phosphor-svelte/lib/Trash';

	let category = $state<SampleCategory | 'all'>('all');
	let busy = $state<Record<string, boolean>>({});

	let visible = $derived(
		category === 'all' ? sampleDatasets : sampleDatasets.filter((d) => d.category === category)
	);

	async function add(dataset: SampleDataset) {
		busy[dataset.id] = true;
		try {
			await installSampleDataset(dataset);
			toast.success(`${dataset.name} is ready as table “${dataset.tableName}”`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Download failed.');
		} finally {
			busy[dataset.id] = false;
		}
	}

	async function remove(dataset: SampleDataset) {
		await connectionsStore.remove(sampleConnectionId(dataset.id));
		toast(`${dataset.name} removed`);
	}
</script>

<div class="flex h-full flex-col gap-3 p-3">
	<div>
		<p class="text-sm font-medium">Sample datasets</p>
		<p class="text-muted-foreground text-xs">
			Curated open data, downloaded on demand and queryable as local tables right away.
		</p>
	</div>

	<div class="flex flex-wrap gap-1">
		{#each ['all', ...Object.keys(sampleCategories)] as const as value (value)}
			<button
				type="button"
				class={cn(
					'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
					category === value
						? 'bg-primary text-primary-foreground border-primary'
						: 'text-muted-foreground hover:bg-accent'
				)}
				onclick={() => (category = value as SampleCategory | 'all')}
			>
				{value === 'all' ? 'All' : sampleCategories[value as SampleCategory]}
			</button>
		{/each}
	</div>

	<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto pr-1">
		{#each visible as dataset (dataset.id)}
			{@const installed = isSampleInstalled(dataset.id)}
			<div class="rounded-lg border p-3">
				<div class="flex items-start justify-between gap-2">
					<div class="min-w-0">
						<p class="flex items-center gap-1.5 text-sm font-medium">
							{dataset.name}
							{#if installed}
								<CheckCircleIcon size={14} weight="fill" class="shrink-0 text-emerald-500" />
							{/if}
						</p>
						<p class="text-muted-foreground mt-0.5 text-xs">{dataset.description}</p>
					</div>
					{#if installed}
						<Button
							variant="ghost"
							size="icon"
							class="text-muted-foreground size-7 shrink-0"
							title="Remove dataset"
							onclick={() => remove(dataset)}
						>
							<TrashIcon size={14} />
						</Button>
					{:else}
						<Button
							variant="outline"
							size="sm"
							class="h-7 shrink-0 gap-1 text-xs"
							disabled={busy[dataset.id]}
							onclick={() => add(dataset)}
						>
							{#if busy[dataset.id]}
								<CircleNotchIcon size={13} class="animate-spin" />
							{:else}
								<DownloadSimpleIcon size={13} />
							{/if}
							Add
						</Button>
					{/if}
				</div>
				<div class="mt-2 flex flex-wrap items-center gap-1">
					<span class="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[10px]">
						{sampleCategories[dataset.category]}
					</span>
					<span class="text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
						{dataset.source}
					</span>
					<span class="text-muted-foreground rounded-full border px-2 py-0.5 text-[10px]">
						{dataset.sizeHint}
					</span>
					<span class="text-muted-foreground ml-auto font-mono text-[10px]">
						{dataset.tableName}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>
