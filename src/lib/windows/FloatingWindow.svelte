<script lang="ts">
	import type { Snippet } from 'svelte';
	import { windowManager } from './manager.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import XIcon from 'phosphor-svelte/lib/X';
	import SidebarSimpleIcon from 'phosphor-svelte/lib/SidebarSimple';
	import BrowsersIcon from 'phosphor-svelte/lib/Browsers';
	import ArrowsOutSimpleIcon from 'phosphor-svelte/lib/ArrowsOutSimple';

	const EDGE_SNAP_THRESHOLD = 24;

	let {
		id,
		title,
		icon: Icon,
		dockable = true,
		children
	}: {
		id: string;
		title: string;
		icon: typeof XIcon;
		dockable?: boolean;
		children: Snippet;
	} = $props();

	let win = $derived(windowManager.windows[id]);
	// Which edge the window would dock to if released right now.
	let snapPreview = $state<'left' | 'right' | null>(null);

	function edgeUnderPointer(clientX: number): 'left' | 'right' | null {
		if (!dockable) return null;
		if (clientX <= EDGE_SNAP_THRESHOLD) return 'left';
		if (clientX >= window.innerWidth - EDGE_SNAP_THRESHOLD) return 'right';
		return null;
	}

	function startDrag(event: PointerEvent) {
		if (win.docked) return;
		event.preventDefault();
		windowManager.bringToFront(id);
		const startX = event.clientX;
		const startY = event.clientY;
		const originX = win.x;
		const originY = win.y;

		function onMove(moveEvent: PointerEvent) {
			win.x = Math.max(
				8,
				Math.min(window.innerWidth - 120, originX + (moveEvent.clientX - startX))
			);
			win.y = Math.max(
				8,
				Math.min(window.innerHeight - 80, originY + (moveEvent.clientY - startY))
			);
			snapPreview = edgeUnderPointer(moveEvent.clientX);
		}
		function onUp(upEvent: PointerEvent) {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			const edge = edgeUnderPointer(upEvent.clientX);
			snapPreview = null;
			if (edge) windowManager.dock(id, edge);
		}
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function startResize(event: PointerEvent) {
		event.preventDefault();
		windowManager.bringToFront(id);
		const startX = event.clientX;
		const startY = event.clientY;
		const originW = win.width;
		const originH = win.height;

		function onMove(moveEvent: PointerEvent) {
			win.width = Math.max(320, originW + (moveEvent.clientX - startX));
			win.height = Math.max(240, originH + (moveEvent.clientY - startY));
		}
		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		}
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function startDockResize(event: PointerEvent) {
		event.preventDefault();
		const startX = event.clientX;
		const originW = win.dockWidth;
		const side = win.docked;

		function onMove(moveEvent: PointerEvent) {
			const delta = moveEvent.clientX - startX;
			win.dockWidth = Math.max(
				280,
				Math.min(720, side === 'left' ? originW + delta : originW - delta)
			);
		}
		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		}
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}
</script>

{#if win?.open}
	{#if snapPreview}
		<div
			class="border-primary bg-primary/10 pointer-events-none fixed inset-y-2 z-50 w-[380px] rounded-xl border-2 border-dashed"
			style={`${snapPreview}: 8px;`}
		></div>
	{/if}
	<div
		role="dialog"
		aria-label={title}
		tabindex="-1"
		class={cn(
			'bg-background/80 fixed flex flex-col overflow-hidden border shadow-xl backdrop-blur-xl',
			win.docked ? 'inset-y-0 rounded-none border-y-0' : 'rounded-xl'
		)}
		style={win.docked
			? `${win.docked}: 0; width: ${win.dockWidth}px; z-index: ${40 + win.z};`
			: `left: ${win.x}px; top: ${win.y}px; width: ${win.width}px; height: ${win.height}px; z-index: ${40 + win.z};`}
		onpointerdown={() => windowManager.bringToFront(id)}
	>
		<header
			role="presentation"
			class={cn(
				'flex shrink-0 items-center justify-between gap-2 border-b px-3 py-1.5 select-none',
				!win.docked && 'cursor-grab active:cursor-grabbing'
			)}
			onpointerdown={startDrag}
		>
			<div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
				<Icon size={16} />
				<span class="text-foreground truncate">{title}</span>
			</div>
			<div
				class="flex items-center gap-0.5"
				role="toolbar"
				tabindex="-1"
				aria-label="Window controls"
				onpointerdown={(event) => event.stopPropagation()}
			>
				{#if dockable}
					<Button
						variant="ghost"
						size="icon"
						class={cn('size-6', win.docked === 'left' && 'bg-accent')}
						title="Dock left"
						onclick={() => windowManager.dock(id, win.docked === 'left' ? null : 'left')}
					>
						<SidebarSimpleIcon size={14} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						class={cn('size-6', win.docked === 'right' && 'bg-accent')}
						title="Dock right"
						onclick={() => windowManager.dock(id, win.docked === 'right' ? null : 'right')}
					>
						<SidebarSimpleIcon size={14} class="-scale-x-100" />
					</Button>
					{#if win.docked}
						<Button
							variant="ghost"
							size="icon"
							class="size-6"
							title="Float"
							onclick={() => windowManager.dock(id, null)}
						>
							<BrowsersIcon size={14} />
						</Button>
					{/if}
				{/if}
				<Button
					variant="ghost"
					size="icon"
					class="size-6"
					title="Close"
					onclick={() => windowManager.close(id)}
				>
					<XIcon size={14} />
				</Button>
			</div>
		</header>
		<div class="flex-1 overflow-auto">
			{@render children()}
		</div>
		{#if !win.docked}
			<button
				type="button"
				class="text-muted-foreground absolute right-0 bottom-0 cursor-se-resize p-1"
				aria-label="Resize window"
				onpointerdown={startResize}
			>
				<ArrowsOutSimpleIcon size={12} />
			</button>
		{:else}
			<button
				type="button"
				class={cn(
					'hover:bg-primary/30 absolute inset-y-0 w-1 cursor-col-resize transition-colors',
					win.docked === 'left' ? 'right-0' : 'left-0'
				)}
				aria-label="Resize panel"
				onpointerdown={startDockResize}
			></button>
		{/if}
	</div>
{/if}
