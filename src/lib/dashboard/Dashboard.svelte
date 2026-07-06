<script lang="ts">
	import type { Widget } from '$lib/widgets/types';
	import type { DataConnection } from '$lib/connections/types';
	import WidgetShell from './WidgetShell.svelte';
	import ChartWidget from '$lib/widgets/ChartWidget.svelte';
	import TableWidget from '$lib/widgets/TableWidget.svelte';
	import TextWidget from '$lib/widgets/TextWidget.svelte';
	import { getColorScheme } from '$lib/charts/theme';
	import { cn } from '$lib/utils';

	const GRID_COLS = 12;
	const ROW_HEIGHT = 60;

	let {
		colorScheme,
		widgets,
		connections,
		editable = false,
		onUpdateWidget,
		onRemoveWidget
	}: {
		colorScheme: string;
		widgets: Widget[];
		connections: DataConnection[];
		editable?: boolean;
		onUpdateWidget: (widget: Widget) => void;
		onRemoveWidget: (widgetId: string) => void;
	} = $props();

	let containerWidth = $state(1200);
	let cellWidth = $derived(containerWidth / GRID_COLS);

	// While actively dragging/resizing a widget follows the pointer at the raw pixel
	// position (no rounding) for direct-manipulation feel; only on release does it snap
	// to the nearest grid cell, with a CSS transition animating the "snap".
	let dragState = $state<{ id: string; left: number; top: number } | null>(null);
	let resizeState = $state<{ id: string; width: number; height: number } | null>(null);

	function connectionFor(widget: Widget): DataConnection | undefined {
		if (widget.kind === 'text') return undefined;
		return connections.find(
			(connection) => connection.id === widget.config.dataSource.connectionId
		);
	}

	function startDrag(widget: Widget, event: PointerEvent) {
		if (!editable) return;
		event.preventDefault();
		const startX = event.clientX;
		const startY = event.clientY;
		const startLeft = widget.layout.x * cellWidth;
		const startTop = widget.layout.y * ROW_HEIGHT;
		const maxLeft = (GRID_COLS - widget.layout.w) * cellWidth;
		dragState = { id: widget.id, left: startLeft, top: startTop };

		function onMove(moveEvent: PointerEvent) {
			const left = Math.max(0, Math.min(maxLeft, startLeft + (moveEvent.clientX - startX)));
			const top = Math.max(0, startTop + (moveEvent.clientY - startY));
			dragState = { id: widget.id, left, top };
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (dragState) {
				const newX = Math.max(
					0,
					Math.min(GRID_COLS - widget.layout.w, Math.round(dragState.left / cellWidth))
				);
				const newY = Math.max(0, Math.round(dragState.top / ROW_HEIGHT));
				onUpdateWidget({ ...widget, layout: { ...widget.layout, x: newX, y: newY } });
			}
			dragState = null;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function startResize(widget: Widget, event: PointerEvent) {
		if (!editable) return;
		event.preventDefault();
		const startX = event.clientX;
		const startY = event.clientY;
		const startWidth = widget.layout.w * cellWidth;
		const startHeight = widget.layout.h * ROW_HEIGHT;
		const maxWidth = (GRID_COLS - widget.layout.x) * cellWidth;
		resizeState = { id: widget.id, width: startWidth, height: startHeight };

		function onMove(moveEvent: PointerEvent) {
			const width = Math.max(
				2 * cellWidth,
				Math.min(maxWidth, startWidth + (moveEvent.clientX - startX))
			);
			const height = Math.max(2 * ROW_HEIGHT, startHeight + (moveEvent.clientY - startY));
			resizeState = { id: widget.id, width, height };
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (resizeState) {
				const newW = Math.max(
					2,
					Math.min(GRID_COLS - widget.layout.x, Math.round(resizeState.width / cellWidth))
				);
				const newH = Math.max(2, Math.round(resizeState.height / ROW_HEIGHT));
				onUpdateWidget({ ...widget, layout: { ...widget.layout, w: newW, h: newH } });
			}
			resizeState = null;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	let scheme = $derived(getColorScheme(colorScheme));
	let containerHeight = $derived(
		Math.max(400, ...widgets.map((widget) => (widget.layout.y + widget.layout.h) * ROW_HEIGHT))
	);
</script>

<div
	bind:clientWidth={containerWidth}
	class="relative w-full"
	style={`height: ${containerHeight}px; --color-primary: ${scheme.primary}`}
>
	{#each widgets as widget (widget.id)}
		{@const isDragging = dragState?.id === widget.id}
		{@const isResizing = resizeState?.id === widget.id}
		{@const left = isDragging && dragState ? dragState.left : widget.layout.x * cellWidth}
		{@const top = isDragging && dragState ? dragState.top : widget.layout.y * ROW_HEIGHT}
		{@const width = isResizing && resizeState ? resizeState.width : widget.layout.w * cellWidth}
		{@const height = isResizing && resizeState ? resizeState.height : widget.layout.h * ROW_HEIGHT}
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
				onDragStart={(event) => startDrag(widget, event)}
				onResizeStart={(event) => startResize(widget, event)}
				onRemove={() => onRemoveWidget(widget.id)}
				onUpdate={onUpdateWidget}
			>
				{#if widget.kind === 'text'}
					<TextWidget {widget} />
				{:else if widget.kind === 'table'}
					<TableWidget {widget} connection={connectionFor(widget)} />
				{:else if widget.kind === 'chart'}
					<ChartWidget {widget} connection={connectionFor(widget)} />
				{/if}
			</WidgetShell>
		</div>
	{/each}
</div>
