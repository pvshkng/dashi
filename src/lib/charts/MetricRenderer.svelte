<script lang="ts">
	import type { MetricNodeConfig } from '$lib/workflow/types';

	let { rows, config }: { rows: Record<string, unknown>[]; config: MetricNodeConfig } = $props();

	let raw = $derived(rows[0]?.[config.column]);
	let display = $derived.by(() => {
		if (raw === null || raw === undefined) return '—';
		const num = Number(raw);
		if (!Number.isNaN(num) && raw !== '') return num.toLocaleString();
		return String(raw);
	});
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-1">
	{#if !config.column}
		<p class="text-muted-foreground text-sm">Pick a value column.</p>
	{:else}
		<p class="text-3xl font-semibold tracking-tight tabular-nums">
			{config.prefix ?? ''}{display}{config.suffix ?? ''}
		</p>
		{#if config.label}
			<p class="text-muted-foreground text-xs">{config.label}</p>
		{/if}
	{/if}
</div>
