<script lang="ts">
	import type { ShapeWidget } from './types';

	let { widget }: { widget: ShapeWidget } = $props();

	let config = $derived(widget.config);
	let sw = $derived(config.strokeWidth);
</script>

<svg
	class="h-full w-full"
	viewBox="0 0 100 100"
	preserveAspectRatio="none"
	role="img"
	aria-label={`${config.shape} shape`}
>
	{#if config.shape === 'rectangle'}
		<rect
			x={sw / 2}
			y={sw / 2}
			width={100 - sw}
			height={100 - sw}
			fill={config.fill}
			stroke={config.stroke}
			stroke-width={sw}
			vector-effect="non-scaling-stroke"
		/>
	{:else if config.shape === 'ellipse'}
		<ellipse
			cx="50"
			cy="50"
			rx={50 - sw / 2}
			ry={50 - sw / 2}
			fill={config.fill}
			stroke={config.stroke}
			stroke-width={sw}
			vector-effect="non-scaling-stroke"
		/>
	{:else if config.shape === 'triangle'}
		<polygon
			points={`50,${sw} ${100 - sw},${100 - sw} ${sw},${100 - sw}`}
			fill={config.fill}
			stroke={config.stroke}
			stroke-width={sw}
			vector-effect="non-scaling-stroke"
		/>
	{:else if config.shape === 'line'}
		<line
			x1="0"
			y1="50"
			x2="100"
			y2="50"
			stroke={config.stroke}
			stroke-width={sw}
			vector-effect="non-scaling-stroke"
		/>
	{:else if config.shape === 'arrow'}
		<line
			x1="0"
			y1="50"
			x2="88"
			y2="50"
			stroke={config.stroke}
			stroke-width={sw}
			vector-effect="non-scaling-stroke"
		/>
		<polygon points="86,38 100,50 86,62" fill={config.stroke} />
	{/if}
</svg>
