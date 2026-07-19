<script lang="ts">
	import type { Widget, WidgetStyle } from '$lib/widgets/types';
	import { cn } from '$lib/utils';
	import TrashIcon from 'phosphor-svelte/lib/Trash';
	import ArrowsOutIcon from 'phosphor-svelte/lib/ArrowsOut';
	import SlidersIcon from 'phosphor-svelte/lib/Sliders';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';

	let {
		widget,
		children,
		editable = false,
		dragging = false,
		resizing = false,
		invalid = false,
		onDragStart,
		onResizeStart,
		onRemove,
		onOpenConfig,
		onOpenWorkflow
	}: {
		widget: Widget;
		children: import('svelte').Snippet;
		editable?: boolean;
		dragging?: boolean;
		resizing?: boolean;
		invalid?: boolean;
		onDragStart: (event: PointerEvent) => void;
		onResizeStart: (event: PointerEvent) => void;
		onRemove: () => void;
		onOpenConfig: () => void;
		onOpenWorkflow?: () => void;
	} = $props();

	const fontFamilies: Record<NonNullable<WidgetStyle['fontFamily']>, string> = {
		sans: 'ui-sans-serif, system-ui, sans-serif',
		serif: 'ui-serif, Georgia, serif',
		mono: "'JetBrains Mono Variable', monospace"
	};
	const shadows: Record<NonNullable<WidgetStyle['shadow']>, string> = {
		none: 'none',
		sm: '0 1px 2px rgb(0 0 0 / 0.08)',
		md: '0 4px 12px rgb(0 0 0 / 0.12)',
		lg: '0 10px 30px rgb(0 0 0 / 0.2)'
	};

	let style = $derived(widget.style);
	let containerStyle = $derived(
		[
			style?.backgroundColor && `background-color: ${style.backgroundColor}`,
			style?.textColor && `color: ${style.textColor}`,
			style?.borderColor && `border-color: ${style.borderColor}`,
			`border-width: ${style?.borderWidth ?? 1}px`,
			`border-radius: ${style?.borderRadius ?? 8}px`,
			style?.shadow && `box-shadow: ${shadows[style.shadow]}`,
			style?.opacity !== undefined && `opacity: ${style.opacity / 100}`,
			style?.fontSize && `font-size: ${style.fontSize}px`,
			style?.fontFamily && `font-family: ${fontFamilies[style.fontFamily]}`,
			style?.textAlign && `text-align: ${style.textAlign}`
		]
			.filter(Boolean)
			.join('; ')
	);
</script>

<div
	class={cn(
		'relative flex h-full w-full flex-col overflow-hidden border backdrop-blur-md',
		!style?.backgroundColor && 'bg-background/50',
		(dragging || resizing) &&
			(invalid ? 'ring-destructive shadow-lg ring-2' : 'ring-primary shadow-lg ring-2')
	)}
	style={containerStyle}
>
	<div
		role="presentation"
		class={cn(
			'flex items-center justify-between gap-1 border-b border-inherit px-2 py-1 select-none',
			editable && 'cursor-grab active:cursor-grabbing'
		)}
		onpointerdown={(event) => editable && onDragStart(event)}
	>
		<span class="truncate text-sm font-medium">{widget.title}</span>
		{#if editable}
			<div
				class="flex shrink-0 items-center gap-0.5"
				role="toolbar"
				tabindex="-1"
				aria-label="Widget actions"
				onpointerdown={(event) => event.stopPropagation()}
			>
				{#if widget.kind === 'viz' && onOpenWorkflow}
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground p-0.5"
						title="Open workflow"
						aria-label="Open the workflow behind this widget"
						onclick={onOpenWorkflow}
					>
						<FlowArrowIcon size={14} />
					</button>
				{/if}
				<button
					type="button"
					class="text-muted-foreground hover:text-foreground p-0.5"
					title="Settings & style"
					aria-label="Widget settings and style"
					onclick={onOpenConfig}
				>
					<SlidersIcon size={14} />
				</button>
				<button
					type="button"
					class="text-muted-foreground hover:text-destructive p-0.5"
					title="Remove widget"
					aria-label="Remove widget"
					onclick={onRemove}
				>
					<TrashIcon size={14} />
				</button>
			</div>
		{/if}
	</div>
	<div class="flex-1 overflow-hidden" style={`padding: ${style?.padding ?? 8}px`}>
		{@render children()}
	</div>
	{#if editable}
		<button
			type="button"
			class="text-muted-foreground absolute right-0 bottom-0 cursor-se-resize p-1"
			onpointerdown={onResizeStart}
			aria-label="Resize widget"
		>
			<ArrowsOutIcon size={12} />
		</button>
	{/if}
</div>
