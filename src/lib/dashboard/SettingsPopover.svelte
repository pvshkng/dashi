<script lang="ts">
	import type { Widget } from '$lib/widgets/types';
	import * as Popover from '$lib/components/ui/popover';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Button } from '$lib/components/ui/button';
	import WrenchIcon from 'phosphor-svelte/lib/Wrench';

	let {
		widget,
		onChange
	}: {
		widget: Widget;
		onChange: (widget: Widget) => void;
	} = $props();

	let open = $state(false);
	let title = $state('');
	let textContent = $state('');

	function syncFromWidget() {
		title = widget.title;
		if (widget.kind === 'text') textContent = widget.config.content;
	}

	function apply() {
		if (widget.kind === 'text') {
			onChange({ ...widget, title, config: { ...widget.config, content: textContent } });
		} else {
			onChange({ ...widget, title });
		}
		open = false;
	}
</script>

<Popover.Root bind:open onOpenChange={(value) => value && syncFromWidget()}>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class="text-muted-foreground hover:text-foreground p-0.5"
				title="Widget settings"
				aria-label="Widget settings"
			>
				<WrenchIcon size={14} />
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-72 space-y-3" side="bottom" align="start">
		<p class="text-sm font-medium">Widget settings</p>
		<div class="space-y-1">
			<Label class="text-xs">Title</Label>
			<Input bind:value={title} class="h-8 text-xs" />
		</div>
		{#if widget.kind === 'text'}
			<div class="space-y-1">
				<Label class="text-xs">Content</Label>
				<Textarea bind:value={textContent} rows={4} class="text-xs" />
			</div>
		{/if}
		<Button size="sm" class="w-full" onclick={apply}>Apply</Button>
	</Popover.Content>
</Popover.Root>
