<script lang="ts">
	import type { FreeRect, Widget, WidgetLayout } from '$lib/widgets/types';
	import type { DashboardLayoutMode } from '$lib/workspace/store.svelte';
	import WidgetShell from './WidgetShell.svelte';
	import WidgetConfigPanel from './WidgetConfigPanel.svelte';
	import VizWidget from '$lib/widgets/VizWidget.svelte';
	import TextWidget from '$lib/widgets/TextWidget.svelte';
	import ShapeWidget from '$lib/widgets/ShapeWidget.svelte';
	import FilterWidget from '$lib/widgets/FilterWidget.svelte';
	import FloatingWindow from '$lib/windows/FloatingWindow.svelte';
	import { windowManager } from '$lib/windows/manager.svelte';
	import { getColorScheme } from '$lib/charts/theme';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cn } from '$lib/utils';
	import SlidersIcon from 'phosphor-svelte/lib/Sliders';

	const GRID_COLS = 12;
	const ROW_HEIGHT = 60;
	const FREE_MIN = 48;

	let {
		colorScheme,
		showGrid = false,
		layoutMode = 'grid',
		widgets,
		editable = false,
		mobile = false,
		onUpdateWidget,
		onRemoveWidget
	}: {
		colorScheme: string;
		showGrid?: boolean;
		layoutMode?: DashboardLayoutMode;
		widgets: Widget[];
		editable?: boolean;
		mobile?: boolean;
		onUpdateWidget: (widget: Widget) => void;
		onRemoveWidget: (widgetId: string) => void;
	} = $props();

	let containerWidth = $state(1200);
	let cellWidth = $derived(containerWidth / GRID_COLS);
	let free = $derived(layoutMode === 'free');

	// While dragging/resizing, the active widget follows the pointer at raw pixel
	// positions. In grid mode the other widgets scoot out of the way live via
	// previewLayouts and everything commits on release.
	let dragState = $state<{ id: string; left: number; top: number } | null>(null);
	let resizeState = $state<{ id: string; width: number; height: number } | null>(null);
	let previewLayouts = $state<Record<string, WidgetLayout> | null>(null);

	function layoutsCollide(a: WidgetLayout, b: WidgetLayout): boolean {
		return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
	}

	/**
	 * Fixes the moved widget at its target cell and pushes every colliding
	 * widget downward until nothing overlaps, gridstack-style.
	 */
	function resolvePush(movedId: string, moved: WidgetLayout): Record<string, WidgetLayout> {
		const placed: Record<string, WidgetLayout> = { [movedId]: moved };
		const others = widgets
			.filter((widget) => widget.id !== movedId)
			.sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
		for (const other of others) {
			const candidate = { ...other.layout };
			let guard = 0;
			while (guard++ < 100) {
				const hit = Object.values(placed).find((p) => layoutsCollide(candidate, p));
				if (!hit) break;
				candidate.y = hit.y + hit.h;
			}
			placed[other.id] = candidate;
		}
		return placed;
	}

	function commitLayouts(placed: Record<string, WidgetLayout>) {
		for (const widget of widgets) {
			const layout = placed[widget.id];
			if (!layout) continue;
			const current = widget.layout;
			if (
				layout.x !== current.x ||
				layout.y !== current.y ||
				layout.w !== current.w ||
				layout.h !== current.h
			) {
				onUpdateWidget({ ...widget, layout });
			}
		}
	}

	function snappedDragLayout(widget: Widget, left: number, top: number): WidgetLayout {
		const x = Math.max(0, Math.min(GRID_COLS - widget.layout.w, Math.round(left / cellWidth)));
		const y = Math.max(0, Math.round(top / ROW_HEIGHT));
		return { ...widget.layout, x, y };
	}

	function snappedResizeLayout(widget: Widget, width: number, height: number): WidgetLayout {
		const w = Math.max(1, Math.min(GRID_COLS - widget.layout.x, Math.round(width / cellWidth)));
		const h = Math.max(1, Math.round(height / ROW_HEIGHT));
		return { ...widget.layout, w, h };
	}

	/** Freeform rect for a widget, derived from the grid layout the first time. */
	function freeRect(widget: Widget): FreeRect {
		return (
			widget.free ?? {
				x: widget.layout.x * cellWidth,
				y: widget.layout.y * ROW_HEIGHT,
				w: widget.layout.w * cellWidth,
				h: widget.layout.h * ROW_HEIGHT,
				z: 1
			}
		);
	}

	function bringToFront(widget: Widget) {
		if (!free || !editable) return;
		const maxZ = Math.max(0, ...widgets.map((w) => w.free?.z ?? 0));
		const rect = freeRect(widget);
		if (
			(rect.z ?? 0) <= maxZ &&
			widgets.some((w) => w.id !== widget.id && (w.free?.z ?? 0) >= (rect.z ?? 0))
		) {
			onUpdateWidget({ ...widget, free: { ...rect, z: maxZ + 1 } });
		}
	}

	function startDrag(widget: Widget, event: PointerEvent) {
		if (!editable || mobile) return;
		event.preventDefault();
		bringToFront(widget);
		const startX = event.clientX;
		const startY = event.clientY;
		const rect = freeRect(widget);
		const startLeft = free ? rect.x : widget.layout.x * cellWidth;
		const startTop = free ? rect.y : widget.layout.y * ROW_HEIGHT;
		const maxLeft = free ? containerWidth - rect.w : (GRID_COLS - widget.layout.w) * cellWidth;
		dragState = { id: widget.id, left: startLeft, top: startTop };

		function onMove(moveEvent: PointerEvent) {
			const left = Math.max(0, Math.min(maxLeft, startLeft + (moveEvent.clientX - startX)));
			const top = Math.max(0, startTop + (moveEvent.clientY - startY));
			dragState = { id: widget.id, left, top };
			if (!free) {
				previewLayouts = resolvePush(widget.id, snappedDragLayout(widget, left, top));
			}
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (dragState) {
				if (free) {
					const current = freeRect(widget);
					onUpdateWidget({
						...widget,
						free: { ...current, x: dragState.left, y: dragState.top }
					});
				} else {
					commitLayouts(
						resolvePush(widget.id, snappedDragLayout(widget, dragState.left, dragState.top))
					);
				}
			}
			dragState = null;
			previewLayouts = null;
		}

		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}

	function startResize(widget: Widget, event: PointerEvent) {
		if (!editable || mobile) return;
		event.preventDefault();
		bringToFront(widget);
		const startX = event.clientX;
		const startY = event.clientY;
		const rect = freeRect(widget);
		const startWidth = free ? rect.w : widget.layout.w * cellWidth;
		const startHeight = free ? rect.h : widget.layout.h * ROW_HEIGHT;
		const maxWidth = free ? containerWidth - rect.x : (GRID_COLS - widget.layout.x) * cellWidth;
		resizeState = { id: widget.id, width: startWidth, height: startHeight };

		function onMove(moveEvent: PointerEvent) {
			const minW = free ? FREE_MIN : cellWidth;
			const minH = free ? FREE_MIN : ROW_HEIGHT;
			const width = Math.max(minW, Math.min(maxWidth, startWidth + (moveEvent.clientX - startX)));
			const height = Math.max(minH, startHeight + (moveEvent.clientY - startY));
			resizeState = { id: widget.id, width, height };
			if (!free) {
				previewLayouts = resolvePush(widget.id, snappedResizeLayout(widget, width, height));
			}
		}

		function onUp() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			if (resizeState) {
				if (free) {
					const current = freeRect(widget);
					onUpdateWidget({
						...widget,
						free: { ...current, w: resizeState.width, h: resizeState.height }
					});
				} else {
					commitLayouts(
						resolvePush(
							widget.id,
							snappedResizeLayout(widget, resizeState.width, resizeState.height)
						)
					);
				}
			}
			resizeState = null;
			previewLayouts = null;
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
		widgets
			.filter((widget) => widget.kind !== 'shape')
			.toSorted((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x)
	);
	let containerHeight = $derived(
		free
			? Math.max(500, ...widgets.map((widget) => freeRect(widget).y + freeRect(widget).h + 80))
			: Math.max(
					400,
					...widgets.map(
						(widget) =>
							((previewLayouts?.[widget.id] ?? widget.layout).y +
								(previewLayouts?.[widget.id] ?? widget.layout).h) *
							ROW_HEIGHT
					)
				) + (editable ? 4 * ROW_HEIGHT : 0)
	);
	let gridStyle = $derived(
		showGrid && !mobile && !free && editable
			? `background-image: linear-gradient(to right, color-mix(in oklab, currentColor 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, currentColor 10%, transparent) 1px, transparent 1px); background-size: ${cellWidth}px ${ROW_HEIGHT}px;`
			: ''
	);

	function widgetFrame(widget: Widget): {
		left: number;
		top: number;
		width: number;
		height: number;
		z: number;
	} {
		const isDragging = dragState?.id === widget.id;
		const isResizing = resizeState?.id === widget.id;
		if (free) {
			const rect = freeRect(widget);
			return {
				left: isDragging && dragState ? dragState.left : rect.x,
				top: isDragging && dragState ? dragState.top : rect.y,
				width: isResizing && resizeState ? resizeState.width : rect.w,
				height: isResizing && resizeState ? resizeState.height : rect.h,
				z: isDragging || isResizing ? 999 : (rect.z ?? 1)
			};
		}
		const layout = previewLayouts?.[widget.id] ?? widget.layout;
		return {
			left: isDragging && dragState ? dragState.left : layout.x * cellWidth,
			top: isDragging && dragState ? dragState.top : layout.y * ROW_HEIGHT,
			width: isResizing && resizeState ? resizeState.width : layout.w * cellWidth,
			height: isResizing && resizeState ? resizeState.height : layout.h * ROW_HEIGHT,
			z: isDragging || isResizing ? 999 : 1
		};
	}
</script>

{#snippet widgetBody(widget: Widget)}
	{#if widget.kind === 'text'}
		<TextWidget {widget} />
	{:else if widget.kind === 'viz'}
		<VizWidget {widget} />
	{:else if widget.kind === 'shape'}
		<ShapeWidget {widget} />
	{:else if widget.kind === 'filter'}
		<FilterWidget {widget} />
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
		data-dashboard-canvas
		class="relative w-full"
		style={`height: ${containerHeight}px; --color-primary: ${scheme.primary}; ${gridStyle}`}
	>
		{#if !free && previewLayouts}
			{@const activeId = dragState?.id ?? resizeState?.id}
			{@const target = activeId ? previewLayouts[activeId] : undefined}
			{#if target}
				<div
					class="border-primary/50 bg-primary/10 pointer-events-none absolute rounded-lg border-2 border-dashed transition-[left,top,width,height] duration-100"
					style={`left: ${target.x * cellWidth}px; top: ${target.y * ROW_HEIGHT}px; width: ${target.w * cellWidth}px; height: ${target.h * ROW_HEIGHT}px; z-index: 5;`}
				></div>
			{/if}
		{/if}
		{#each widgets as widget (widget.id)}
			{@const isDragging = dragState?.id === widget.id}
			{@const isResizing = resizeState?.id === widget.id}
			{@const frame = widgetFrame(widget)}
			<div
				class={cn(
					'absolute p-1',
					!isDragging &&
						!isResizing &&
						'transition-[left,top,width,height] duration-200 ease-[cubic-bezier(0.34,1.3,0.64,1)]'
				)}
				style={`left: ${frame.left}px; top: ${frame.top}px; width: ${frame.width}px; height: ${frame.height}px; z-index: ${frame.z};`}
			>
				<WidgetShell
					{widget}
					{editable}
					dragging={isDragging}
					resizing={isResizing}
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
