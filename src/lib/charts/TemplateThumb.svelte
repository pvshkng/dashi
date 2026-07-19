<script lang="ts">
	import type { ThumbKind } from '$lib/workflow/templates';
	import { cn } from '$lib/utils';

	let { kind, class: className = '' }: { kind: ThumbKind; class?: string } = $props();

	const bars = [28, 44, 20, 52, 36, 58, 47];
	const dots = [
		[14, 52],
		[26, 44],
		[35, 48],
		[48, 34],
		[58, 38],
		[72, 24],
		[84, 28],
		[98, 16],
		[106, 22]
	];
</script>

<svg
	viewBox="0 0 120 72"
	class={cn('text-primary h-full w-full', className)}
	role="img"
	aria-label="{kind} preview"
>
	{#if kind === 'bar'}
		{#each bars as h, i (i)}
			<rect
				x={8 + i * 15.5}
				y={64 - h}
				width="10"
				height={h}
				rx="2"
				fill="currentColor"
				opacity={0.45 + (i % 3) * 0.2}
			/>
		{/each}
	{:else if kind === 'line'}
		<polyline
			points="8,56 26,44 42,48 58,30 74,36 92,18 112,24"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<polyline
			points="8,62 26,58 42,52 58,54 74,44 92,40 112,30"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			opacity="0.35"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	{:else if kind === 'area'}
		<path
			d="M8 58 L28 46 L46 50 L64 32 L82 38 L102 16 L112 20 L112 64 L8 64 Z"
			fill="currentColor"
			opacity="0.3"
		/>
		<path
			d="M8 58 L28 46 L46 50 L64 32 L82 38 L102 16 L112 20"
			fill="none"
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linecap="round"
		/>
	{:else if kind === 'pie'}
		<circle cx="60" cy="36" r="26" fill="currentColor" opacity="0.25" />
		<path d="M60 36 L60 10 A26 26 0 0 1 84.5 44.5 Z" fill="currentColor" opacity="0.85" />
		<path d="M60 36 L84.5 44.5 A26 26 0 0 1 47 59 Z" fill="currentColor" opacity="0.5" />
	{:else if kind === 'scatter'}
		{#each dots as [x, y], i (i)}
			<circle cx={x} cy={y} r="4" fill="currentColor" opacity={0.35 + (i % 4) * 0.15} />
		{/each}
	{:else if kind === 'metric'}
		<text x="60" y="40" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor">
			1.2M
		</text>
		<rect x="36" y="50" width="48" height="5" rx="2.5" fill="currentColor" opacity="0.3" />
	{:else}
		{#each [14, 27, 40, 53] as y, i (y)}
			<rect x="10" {y} width="24" height="6" rx="2" fill="currentColor" opacity="0.55" />
			<rect
				x="42"
				{y}
				width={i % 2 === 0 ? 38 : 28}
				height="6"
				rx="2"
				fill="currentColor"
				opacity="0.3"
			/>
			<rect x="90" {y} width="20" height="6" rx="2" fill="currentColor" opacity="0.3" />
		{/each}
	{/if}
</svg>
