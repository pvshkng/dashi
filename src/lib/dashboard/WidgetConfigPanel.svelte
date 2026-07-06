<script lang="ts">
	import type { Widget, WidgetStyle } from '$lib/widgets/types';
	import * as Select from '$lib/components/ui/select';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Slider } from '$lib/components/ui/slider';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { cn } from '$lib/utils';
	import TextAlignLeftIcon from 'phosphor-svelte/lib/TextAlignLeft';
	import TextAlignCenterIcon from 'phosphor-svelte/lib/TextAlignCenter';
	import TextAlignRightIcon from 'phosphor-svelte/lib/TextAlignRight';

	let {
		widget,
		onChange
	}: {
		widget: Widget;
		onChange: (widget: Widget) => void;
	} = $props();

	let style = $derived(widget.style);

	function set<K extends keyof WidgetStyle>(key: K, value: WidgetStyle[K]) {
		onChange({ ...widget, style: { ...style, [key]: value } });
	}

	const fontLabels = { sans: 'Sans', serif: 'Serif', mono: 'Mono' } as const;
	const shadowLabels = { none: 'None', sm: 'Small', md: 'Medium', lg: 'Large' } as const;
	const aligns = [
		{ value: 'left', icon: TextAlignLeftIcon },
		{ value: 'center', icon: TextAlignCenterIcon },
		{ value: 'right', icon: TextAlignRightIcon }
	] as const;
</script>

<div class="space-y-3 p-3">
	<div class="space-y-1">
		<Label class="text-xs">Title</Label>
		<Input
			value={widget.title}
			class="h-8 text-xs"
			oninput={(event) => onChange({ ...widget, title: (event.target as HTMLInputElement).value })}
		/>
	</div>
	{#if widget.kind === 'text'}
		<div class="space-y-1">
			<Label class="text-xs">Content</Label>
			<Textarea
				value={widget.config.content}
				rows={4}
				class="text-xs"
				oninput={(event) =>
					onChange({
						...widget,
						config: { ...widget.config, content: (event.target as HTMLTextAreaElement).value }
					})}
			/>
		</div>
	{/if}

	<Separator />
	<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">Style</p>

	<div class="grid grid-cols-2 gap-2">
		<div class="space-y-1">
			<Label class="text-xs">Font</Label>
			<Select.Root
				type="single"
				value={style?.fontFamily ?? 'mono'}
				onValueChange={(value) => set('fontFamily', value as WidgetStyle['fontFamily'])}
			>
				<Select.Trigger class="h-8 w-full text-xs">
					{fontLabels[style?.fontFamily ?? 'mono']}
				</Select.Trigger>
				<Select.Content>
					{#each Object.entries(fontLabels) as [value, label] (value)}
						<Select.Item {value} {label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-1">
			<Label class="text-xs">Align</Label>
			<div class="flex rounded-md border p-0.5">
				{#each aligns as align (align.value)}
					{@const AlignIcon = align.icon}
					<button
						type="button"
						class={cn(
							'text-muted-foreground flex flex-1 items-center justify-center rounded p-1',
							(style?.textAlign ?? 'left') === align.value && 'bg-accent text-foreground'
						)}
						aria-label={`Align ${align.value}`}
						onclick={() => set('textAlign', align.value)}
					>
						<AlignIcon size={14} />
					</button>
				{/each}
			</div>
		</div>
	</div>

	<div class="space-y-1">
		<Label class="text-xs">Font size — {style?.fontSize ?? 14}px</Label>
		<Slider
			type="single"
			value={style?.fontSize ?? 14}
			min={10}
			max={32}
			step={1}
			onValueChange={(value) => set('fontSize', value)}
		/>
	</div>

	<div class="grid grid-cols-3 gap-2">
		<div class="space-y-1">
			<Label class="text-xs">Text</Label>
			<input
				type="color"
				class="h-8 w-full cursor-pointer rounded-md border"
				value={style?.textColor ?? '#404040'}
				oninput={(event) => set('textColor', (event.target as HTMLInputElement).value)}
			/>
		</div>
		<div class="space-y-1">
			<Label class="text-xs">Fill</Label>
			<input
				type="color"
				class="h-8 w-full cursor-pointer rounded-md border"
				value={style?.backgroundColor ?? '#ffffff'}
				oninput={(event) => set('backgroundColor', (event.target as HTMLInputElement).value)}
			/>
		</div>
		<div class="space-y-1">
			<Label class="text-xs">Border</Label>
			<input
				type="color"
				class="h-8 w-full cursor-pointer rounded-md border"
				value={style?.borderColor ?? '#e5e5e5'}
				oninput={(event) => set('borderColor', (event.target as HTMLInputElement).value)}
			/>
		</div>
	</div>

	<div class="space-y-1">
		<Label class="text-xs">Border width — {style?.borderWidth ?? 1}px</Label>
		<Slider
			type="single"
			value={style?.borderWidth ?? 1}
			min={0}
			max={6}
			step={1}
			onValueChange={(value) => set('borderWidth', value)}
		/>
	</div>

	<div class="space-y-1">
		<Label class="text-xs">Corner radius — {style?.borderRadius ?? 8}px</Label>
		<Slider
			type="single"
			value={style?.borderRadius ?? 8}
			min={0}
			max={32}
			step={1}
			onValueChange={(value) => set('borderRadius', value)}
		/>
	</div>

	<div class="space-y-1">
		<Label class="text-xs">Padding — {style?.padding ?? 8}px</Label>
		<Slider
			type="single"
			value={style?.padding ?? 8}
			min={0}
			max={32}
			step={1}
			onValueChange={(value) => set('padding', value)}
		/>
	</div>

	<div class="grid grid-cols-2 gap-2">
		<div class="space-y-1">
			<Label class="text-xs">Shadow</Label>
			<Select.Root
				type="single"
				value={style?.shadow ?? 'none'}
				onValueChange={(value) => set('shadow', value as WidgetStyle['shadow'])}
			>
				<Select.Trigger class="h-8 w-full text-xs">
					{shadowLabels[style?.shadow ?? 'none']}
				</Select.Trigger>
				<Select.Content>
					{#each Object.entries(shadowLabels) as [value, label] (value)}
						<Select.Item {value} {label} />
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
		<div class="space-y-1">
			<Label class="text-xs">Opacity — {style?.opacity ?? 100}%</Label>
			<Slider
				type="single"
				value={style?.opacity ?? 100}
				min={20}
				max={100}
				step={5}
				onValueChange={(value) => set('opacity', value)}
			/>
		</div>
	</div>

	<Button
		variant="outline"
		size="sm"
		class="w-full"
		onclick={() => onChange({ ...widget, style: {} })}
	>
		Reset style
	</Button>
</div>
