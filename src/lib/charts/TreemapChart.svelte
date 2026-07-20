<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import type { ValueFormat } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';

	let {
		rows,
		x,
		y,
		colors,
		format,
		onSelect
	}: {
		rows: Record<string, unknown>[];
		x: string;
		y: string;
		colors: string[];
		format?: ValueFormat;
		onSelect?: (value: string) => void;
	} = $props();

	let width = $state(400);
	let height = $state(240);

	interface Tile {
		label: string;
		value: number;
		x: number;
		y: number;
		w: number;
		h: number;
	}

	/** Squarified treemap (Bruls et al.), laying strips into the shorter side. */
	function squarify(items: { label: string; value: number }[], w: number, h: number): Tile[] {
		const total = items.reduce((sum, item) => sum + item.value, 0);
		if (total <= 0 || w <= 0 || h <= 0) return [];
		const scaled = items
			.filter((item) => item.value > 0)
			.toSorted((a, b) => b.value - a.value)
			.map((item) => ({ ...item, area: (item.value / total) * w * h }));

		const tiles: Tile[] = [];
		let x0 = 0;
		let y0 = 0;
		let remW = w;
		let remH = h;
		let strip: typeof scaled = [];

		function worst(list: typeof scaled, side: number): number {
			const area = list.reduce((sum, item) => sum + item.area, 0);
			const thickness = area / side;
			let max = 0;
			for (const item of list) {
				const other = item.area / thickness;
				max = Math.max(max, thickness / other, other / thickness);
			}
			return max;
		}

		function layoutStrip(list: typeof scaled) {
			const area = list.reduce((sum, item) => sum + item.area, 0);
			const vertical = remW >= remH;
			const side = vertical ? remH : remW;
			const thickness = area / side;
			let offset = 0;
			for (const item of list) {
				const length = item.area / thickness;
				tiles.push(
					vertical
						? {
								label: item.label,
								value: item.value,
								x: x0,
								y: y0 + offset,
								w: thickness,
								h: length
							}
						: {
								label: item.label,
								value: item.value,
								x: x0 + offset,
								y: y0,
								w: length,
								h: thickness
							}
				);
				offset += length;
			}
			if (vertical) {
				x0 += thickness;
				remW -= thickness;
			} else {
				y0 += thickness;
				remH -= thickness;
			}
		}

		for (const item of scaled) {
			const side = remW >= remH ? remH : remW;
			if (strip.length === 0 || worst([...strip, item], side) <= worst(strip, side)) {
				strip.push(item);
			} else {
				layoutStrip(strip);
				strip = [item];
			}
		}
		if (strip.length > 0) layoutStrip(strip);
		return tiles;
	}

	let tiles = $derived.by(() => {
		const byLabel = new SvelteMap<string, number>();
		for (const row of rows) {
			const label = String(row[x] ?? '');
			byLabel.set(label, (byLabel.get(label) ?? 0) + (toNumber(row[y]) ?? 0));
		}
		const items = [...byLabel.entries()].map(([label, value]) => ({ label, value }));
		return squarify(items, width, height);
	});
</script>

<div class="h-full w-full" bind:clientWidth={width} bind:clientHeight={height}>
	<svg {width} {height} role="img">
		{#each tiles as tile, i (tile.label)}
			<rect
				x={tile.x + 1}
				y={tile.y + 1}
				width={Math.max(1, tile.w - 2)}
				height={Math.max(1, tile.h - 2)}
				rx="2"
				fill={colors[i % colors.length]}
				opacity={0.9 - (i % colors.length) * 0.06}
				class={onSelect ? 'cursor-pointer hover:opacity-60' : ''}
				role="presentation"
				onclick={() => onSelect?.(tile.label)}
			>
				<title>{tile.label}: {formatValue(tile.value, format)}</title>
			</rect>
			{#if tile.w > 44 && tile.h > 26}
				<text
					x={tile.x + 6}
					y={tile.y + 15}
					class="pointer-events-none fill-white text-[10px] font-medium"
				>
					{tile.label.length > Math.floor(tile.w / 7)
						? `${tile.label.slice(0, Math.floor(tile.w / 7))}…`
						: tile.label}
				</text>
				{#if tile.h > 40}
					<text x={tile.x + 6} y={tile.y + 28} class="pointer-events-none fill-white/80 text-[9px]">
						{formatValue(tile.value, format)}
					</text>
				{/if}
			{/if}
		{/each}
	</svg>
</div>
