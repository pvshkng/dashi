<script lang="ts">
	import { workspaceStore } from '$lib/workspace/store.svelte';
	import { colorSchemes } from '$lib/charts/theme';
	import { dashboardThemes, getDashboardTheme } from '$lib/dashboard/themes';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
</script>

<div class="flex h-full flex-col gap-4 p-3">
	<div class="space-y-1">
		<Label>Dashboard name</Label>
		<Input
			value={workspaceStore.settings.name}
			oninput={(event) =>
				workspaceStore.updateSettings({ name: (event.target as HTMLInputElement).value })}
		/>
	</div>
	<div class="space-y-1">
		<Label>Theme</Label>
		<Select.Root
			type="single"
			value={workspaceStore.settings.theme}
			onValueChange={(value) => {
				const theme = getDashboardTheme(value);
				workspaceStore.updateSettings({ theme: theme.id, colorScheme: theme.colorScheme });
			}}
		>
			<Select.Trigger class="w-full">
				{getDashboardTheme(workspaceStore.settings.theme).name}
			</Select.Trigger>
			<Select.Content>
				{#each dashboardThemes as theme (theme.id)}
					<Select.Item value={theme.id} label={theme.name} />
				{/each}
			</Select.Content>
		</Select.Root>
		<p class="text-muted-foreground text-xs">
			{getDashboardTheme(workspaceStore.settings.theme).description}
		</p>
	</div>
	<div class="space-y-1">
		<Label>Color scheme</Label>
		<Select.Root
			type="single"
			value={workspaceStore.settings.colorScheme}
			onValueChange={(value) => workspaceStore.updateSettings({ colorScheme: value })}
		>
			<Select.Trigger class="w-full">
				{colorSchemes.find((s) => s.id === workspaceStore.settings.colorScheme)?.name ?? 'Theme'}
			</Select.Trigger>
			<Select.Content>
				{#each colorSchemes as scheme (scheme.id)}
					<Select.Item value={scheme.id} label={scheme.name} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>
	<div class="flex items-center justify-between gap-2">
		<Label for="show-grid">Show grid lines</Label>
		<Switch
			id="show-grid"
			checked={workspaceStore.settings.showGrid}
			onCheckedChange={(checked) => workspaceStore.updateSettings({ showGrid: checked })}
		/>
	</div>
	<div class="space-y-1">
		<Label>Background color</Label>
		<div class="flex items-center gap-2">
			<input
				type="color"
				class="h-9 w-full cursor-pointer rounded-md border"
				value={workspaceStore.settings.backgroundColor ?? '#ffffff'}
				oninput={(event) =>
					workspaceStore.updateSettings({
						backgroundColor: (event.target as HTMLInputElement).value
					})}
			/>
			<Button
				variant="outline"
				size="sm"
				disabled={!workspaceStore.settings.backgroundColor}
				onclick={() => workspaceStore.updateSettings({ backgroundColor: undefined })}
			>
				Reset
			</Button>
		</div>
		<p class="text-muted-foreground text-xs">Reset falls back to the app theme background.</p>
	</div>
</div>
