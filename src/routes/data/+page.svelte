<script lang="ts">
	import DataApp from '$lib/apps/DataApp.svelte';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import HouseIcon from 'phosphor-svelte/lib/House';
</script>

<svelte:head><title>Data — Dashi</title></svelte:head>

<div class="h-[100vh]">
	<DataApp />
</div>

<Button
	variant="outline"
	size="icon"
	class="bg-background/70 fixed right-3 bottom-3 z-40 size-8 rounded-full shadow-md backdrop-blur-md"
	title="Back to desktop"
	href={resolve('/')}
>
	<HouseIcon size={15} />
</Button>
