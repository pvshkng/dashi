<script lang="ts">
	import type { Widget, WidgetLayout } from '$lib/widgets/types';
	import WidgetShell from './WidgetShell.svelte';
	import WidgetConfigPanel from './WidgetConfigPanel.svelte';
	import VizWidget from '$lib/widgets/VizWidget.svelte';
	import TextWidget from '$lib/widgets/TextWidget.svelte';
	import FloatingWindow from '$lib/windows/FloatingWindow.svelte';
	import { windowManager } from '$lib/windows/manager.svelte';
	import { getColorScheme } from '$lib/charts/theme';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import SlidersIcon from 'phosphor-svelte/lib/Sliders';

	const GRID_COLS = 12;
	const ROW_HEIGHT = 60;

	let {
		colorScheme,
		showGrid = false,
		widgets,
		editable = false,
		mobile = false,
		onUpdateWidget,
		onRemoveWidget
	}: {
		colorScheme: string;
		showGrid?: boolean;
		widgets: Widget[];
		editable?: boolean;
		mobile?: boolean;
		onUpdateWidget: (widget: Widget) => void;
		onRemoveWidget: (widgetId: string) => void;
	} = $props();

	let containerWidth = $state(1200);
	let cellWidth = $derived(containerWidth / GRID_COLS);

	// While actively dragging/resizing a widget follows the pointer at the raw pixel
	// position; on release it snaps to the nearest grid cell. Overlapping drops are
	// discarded and the widget animates back.
	let dragState = $state<{ id: string; left: number; top: number; invalid: boolean } | null>(null);
	let resizeState = $state<{ id: string; width: number; height: number; invalid: boolean } | null>(
		null
	);

	function layoutsCollide(a: WidgetLayout, b: WidgetLayout): boolean {
		return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
	}

	function hasCollision(widgetId: string, layout: WidgetLayout): boolean {
		return widgets.some((other) => other.id !== widgetId && layoutsCollide(layout, other.layout));
	}

	function snappedDragLayout(widget: Widget, left: number, top: number): WidgetLayout {
		const x = Math.max(0, Math.min(GRID_COLS - widget.layout.w, Math.round(left / cellWidth)));
		const y = Math.max(0, Math.round(top / ROW_HEIGHT));
		return { ...widget.layout, x, y };
	}

	function snappedResizeLayout(widget: Widget, width: number, height: number): WidgetLayout {
		const w = Math.max(2, Math.min(GRID_COLS - widget.layout.x, Math.round(width / cellWidth)));
		const h = Math.max(2, Math.round(height / ROW_HEIGHT));
		return { ...widget.layout, w, h };
	}

	function startDrag(widget: Widget, event: PointerEvent) {
		if (!editable || mobile) return;
		event.preventDefault();
		const startX = event.clientX;
		const startY = event.clientY;
		const startLeft = widget.layout.x * cellWidth;
		const startTop = widget.layout.y * ROW_HEIGHT;
		const maxLeft = (GRID_COLS - widget.layout.w) * cellWidth;
		dragState = { id: widget.id, left: startLeft, top: startTop, invalid: false };

		function onMove(moveEvent: PointerEvent) {
			const left = Math.max(0, Math.min(maxLeft, startLeft + (moveEvent.clientX - startX)));
			const top = Math.max(0, startTop + (moveEvent.clientY - startY));
			const invalid = hasCollision(widget.id, snappedDragLayout(widget, left, top));
			dragState = { id: widget.id, left, top, invalid };
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (dragState) {
				const layout = snappedDragLayout(widget, dragState.left, dragState.top);
				if (!hasCollision(widget.id, layout)) {
					onUpdateWidget({ ...widget, layout });
				}
			}
			dragState = null;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function startResize(widget: Widget, event: PointerEvent) {
		if (!editable || mobile) return;
		event.preventDefault();
		const startX = event.clientX;
		const startY = event.clientY;
		const startWidth = widget.layout.w * cellWidth;
		const startHeight = widget.layout.h * ROW_HEIGHT;
		const maxWidth = (GRID_COLS - widget.layout.x) * cellWidth;
		resizeState = { id: widget.id, width: startWidth, height: startHeight, invalid: false };

		function onMove(moveEvent: PointerEvent) {
			const width = Math.max(
				2 * cellWidth,
				Math.min(maxWidth, startWidth + (moveEvent.clientX - startX))
			);
			const height = Math.max(2 * ROW_HEIGHT, startHeight + (moveEvent.clientY - startY));
			const invalid = hasCollision(widget.id, snappedResizeLayout(widget, width, height));
			resizeState = { id: widget.id, width, height, invalid };
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (resizeState) {
				const layout = snappedResizeLayout(widget, resizeState.width, resizeState.height);
				if (!hasCollision(widget.id, layout)) {
					onUpdateWidget({ ...widget, layout });
				}
			}
			resizeState = null;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function openConfigWindow(widget: Widget) {
		windowManager.open(`widget-config:${widget.id}`, { width: 340, height: 560 });
	}

	function openWorkflow(widget: Widget) {
		if (widget.kind === 'viz') goto(resolve('/workflows/[id]', { id: widget.config.workflowId }));
	}

	function removeWidget(widget: Widget) {
		windowManager.close(`widget-config:${widget.id}`);
		onRemoveWidget(widget.id);
	}

	let scheme = $derived(getColorScheme(colorScheme));
	// Mobile reads widgets in visual order: top to bottom, then left to right.
	let orderedWidgets = $derived(
		[...widgets].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x)
	);
	let containerHeight = $derived(
		Math.max(400, ...widgets.map((widget) => (widget.layout.y + widget.layout.h) * ROW_HEIGHT))
	);
	let gridStyle = $derived(
		showGrid && !mobile
			? `background-image: linear-gradient(to right, color-mix(in oklab, currentColor 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 12%, transparent) 1px, transparent 1px); background-size: ${cellWidth}px ${ROW_HEIGHT}px;`
			: ''
	);
</script>

{#snippet widgetBody(widget: Widget)}
	{#if widget.kind === 'text'}
		<TextWidget {widget} />
	{:else if widget.kind === 'viz'}
		<VizWidget {widget} />
	{/if}
{/snippet}

{#if mobile}
	<div
		class="mx-auto flex w-full max-w-xl flex-col gap-3"
		style={`--color-primary: ${scheme.primary}`}
	>
		{#each orderedWidgets as widget (widget.id)}
			<div style={`height: ${Math.max(2, widget.layout.h) * ROW_HEIGHT}px`}>
				<WidgetShell
					{widget}
					editable={false}
					onDragStart={() => {}}
					onResizeStart={() => {}}
					onRemove={() => removeWidget(widget)}
					onOpenConfig={() => openConfigWindow(widget)}
				>
					{@render widgetBody(widget)}
				</WidgetShell>
			</div>
		{/each}
	</div>
{:else}
	<div
		bind:clientWidth={containerWidth}
		class="relative w-full"
		style={`height: ${containerHeight}px; --color-primary: ${scheme.primary}; ${gridStyle}`}
	>
		{#each widgets as widget (widget.id)}
			{@const isDragging = dragState?.id === widget.id}
			{@const isResizing = resizeState?.id === widget.id}
			{@const isInvalid =
				(isDragging && (dragState?.invalid ?? false)) ||
				(isResizing && (resizeState?.invalid ?? false))}
			{@const left = isDragging && dragState ? dragState.left : widget.layout.x * cellWidth}
			{@const top = isDragging && dragState ? dragState.top : widget.layout.y * ROW_HEIGHT}
			{@const width = isResizing && resizeState ? resizeState.width : widget.layout.w * cellWidth}
			{@const height =
				isResizing && resizeState ? resizeState.height : widget.layout.h * ROW_HEIGHT}
			<div
				class={cn(
					'absolute p-1',
					!isDragging && !isResizing && 'transition-[left,top,width,height] duration-150 ease-out'
				)}
				style={`left: ${left}px; top: ${top}px; width: ${width}px; height: ${height}px; z-index: ${isDragging || isResizing ? 10 : 1};`}
			>
				<WidgetShell
					{widget}
					{editable}
					dragging={isDragging}
					resizing={isResizing}
					invalid={isInvalid}
					onDragStart={(event) => startDrag(widget, event)}
					onResizeStart={(event) => startResize(widget, event)}
					onRemove={() => removeWidget(widget)}
					onOpenConfig={() => openConfigWindow(widget)}
					onOpenWorkflow={() => openWorkflow(widget)}
				>
					{@render widgetBody(widget)}
				</WidgetShell>
			</div>
		{/each}
	</div>
{/if}

{#each widgets as widget (widget.id)}
	<FloatingWindow
		id={`widget-config:${widget.id}`}
		title={`${widget.title} — settings`}
		icon={SlidersIcon}
		dockable={false}
	>
		<WidgetConfigPanel {widget} onChange={onUpdateWidget} />
	</FloatingWindow>
{/each}
