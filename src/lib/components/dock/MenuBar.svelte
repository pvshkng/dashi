<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { dashiStore } from '$lib/dashi/store.svelte';
	import { windowManager } from '$lib/windows/manager.svelte';
	import type { Widget, WidgetKind } from '$lib/widgets/types';
	import { cn } from '$lib/utils';
	import EyeIcon from 'phosphor-svelte/lib/Eye';
	import PencilSimpleIcon from 'phosphor-svelte/lib/PencilSimple';

	let fileInput: HTMLInputElement | undefined = $state();

	function onFileChosen(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) dashiStore.openFile(file);
		if (fileInput) fileInput.value = '';
	}

	function defaultWidget(kind: WidgetKind): Widget {
		const id = crypto.randomUUID();
		const layout = { x: 0, y: 0, w: 6, h: 4 };
		if (kind === 'text') {
			return { id, title: 'Text', kind, layout, config: { content: 'New text widget' } };
		}
		const dataSource = {
			connectionId: dashiStore.doc?.connections[0]?.id ?? '',
			sql: 'select * from my_table'
		};
		if (kind === 'table') {
			return { id, title: 'Table', kind, layout, config: { dataSource } };
		}
		return {
			id,
			title: 'Chart',
			kind,
			layout,
			config: {
				dataSource,
				chartType: 'line',
				x: '',
				y: '',
				colorScheme: dashiStore.doc?.colorScheme ?? 'blue'
			}
		};
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
					<Menubar.Item onclick={() => dashiStore.newDashboard('Untitled dashboard')}>
						New dashboard
					</Menubar.Item>
					<Menubar.Item onclick={() => fileInput?.click()}>Open .dashi…</Menubar.Item>
					<Menubar.Item onclick={() => dashiStore.openExample()}>Open example</Menubar.Item>
					<Menubar.Separator />
					<Menubar.Item disabled={!dashiStore.doc} onclick={() => dashiStore.saveToFile()}>
						Save as .dashi
					</Menubar.Item>
					<Menubar.Separator />
					<Menubar.Item disabled={!dashiStore.doc} onclick={() => dashiStore.closeDocument()}>
						Close dashboard
					</Menubar.Item>
				</Menubar.Content>
			</Menubar.Menu>
			<Menubar.Menu>
				<Menubar.Trigger>Windows</Menubar.Trigger>
				<Menubar.Content side="top" align="start">
					<Menubar.CheckboxItem
						checked={windowManager.windows.sql.open}
						onclick={() => windowManager.toggle('sql')}
					>
						SQL editor
					</Menubar.CheckboxItem>
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
						Settings
					</Menubar.CheckboxItem>
				</Menubar.Content>
			</Menubar.Menu>
			{#if dashiStore.doc && dashiStore.mode === 'edit'}
				<Menubar.Menu>
					<Menubar.Trigger>Add</Menubar.Trigger>
					<Menubar.Content side="top" align="start">
						<Menubar.Item onclick={() => dashiStore.addWidget(defaultWidget('text'))}>
							Text widget
						</Menubar.Item>
						<Menubar.Item onclick={() => dashiStore.addWidget(defaultWidget('table'))}>
							Table widget
						</Menubar.Item>
						<Menubar.Item onclick={() => dashiStore.addWidget(defaultWidget('chart'))}>
							Chart widget
						</Menubar.Item>
					</Menubar.Content>
				</Menubar.Menu>
			{/if}
		</Menubar.Root>

		{#if dashiStore.doc}
			<Separator orientation="vertical" class="mx-1 h-5!" />
			<span class="text-muted-foreground max-w-40 truncate px-1 text-xs">
				{dashiStore.doc.name}
			</span>
			<div class="bg-muted flex items-center rounded-full p-0.5">
				<Button
					variant="ghost"
					size="icon"
					class={cn('size-7 rounded-full', dashiStore.mode === 'view' && 'bg-background shadow-sm')}
					title="View mode"
					onclick={() => (dashiStore.mode = 'view')}
				>
					<EyeIcon size={14} weight={dashiStore.mode === 'view' ? 'fill' : 'regular'} />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					class={cn('size-7 rounded-full', dashiStore.mode === 'edit' && 'bg-background shadow-sm')}
					title="Edit mode"
					onclick={() => (dashiStore.mode = 'edit')}
				>
					<PencilSimpleIcon size={14} weight={dashiStore.mode === 'edit' ? 'fill' : 'regular'} />
				</Button>
			</div>
		{/if}
	</div>
</div>
