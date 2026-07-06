<script lang="ts">
	import { dashiStore } from '$lib/dashi/store.svelte';
	import { colorSchemes } from '$lib/charts/theme';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
</script>

<div class="flex h-full flex-col gap-4 p-3">
	{#if dashiStore.doc}
		<div class="space-y-1">
			<Label>Dashboard name</Label>
			<Input
				value={dashiStore.doc.name}
				oninput={(event) => dashiStore.rename((event.target as HTMLInputElement).value)}
			/>
		</div>
		<div class="space-y-1">
			<Label>Color scheme</Label>
			<Select.Root
				type="single"
				value={dashiStore.doc.colorScheme}
				onValueChange={(value) => dashiStore.setColorScheme(value)}
			>
				<Select.Trigger class="w-full">
					{colorSchemes.find((s) => s.id === dashiStore.doc?.colorScheme)?.name ?? 'Theme'}
				</Select.Trigger>
				<Select.Content>
					{#each colorSchemes as scheme (scheme.id)}
						<Select.Item value={scheme.id} label={scheme.name} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{:else}
		<p class="text-muted-foreground text-sm">Open a dashboard to edit its settings.</p>
	{/if}
</div>
