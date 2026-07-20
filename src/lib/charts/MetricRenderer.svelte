<script lang="ts">
	import type { MetricNodeConfig } from '$lib/workflow/types';
	import { formatValue, toNumber } from './format';
	import { toast } from 'svelte-sonner';

	let {
		rows,
		config,
		title = ''
	}: { rows: Record<string, unknown>[]; config: MetricNodeConfig; title?: string } = $props();

	let raw = $derived(rows[0]?.[config.column]);
	let num = $derived(toNumber(raw));
	let display = $derived(raw === null || raw === undefined ? '—' : formatValue(raw, config.format));
	let breached = $derived(
		config.alert !== undefined &&
			num !== null &&
			(config.alert.op === 'gt' ? num > config.alert.threshold : num < config.alert.threshold)
	);

	let notified = false;
	$effect(() => {
		if (breached && !notified) {
			notified = true;
			const name = title || config.label || config.column;
			toast.warning(
				`${name} is ${config.alert?.op === 'gt' ? 'above' : 'below'} ${config.alert?.threshold.toLocaleString()}: ${display}`
			);
		} else if (!breached) {
			notified = false;
		}
	});
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-1">
	{#if !config.column}
		<p class="text-muted-foreground text-sm">Pick a value column.</p>
	{:else}
		<p class="text-3xl font-semibold tracking-tight tabular-nums" class:text-destructive={breached}>
			{config.prefix ?? ''}{display}{config.suffix ?? ''}
		</p>
		{#if config.label}
			<p class="text-muted-foreground text-xs">{config.label}</p>
		{/if}
		{#if breached}
			<p class="text-destructive text-[10px] font-medium tracking-wide uppercase">Alert</p>
		{/if}
	{/if}
</div>
