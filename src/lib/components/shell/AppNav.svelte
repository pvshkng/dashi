<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { windowManager } from '$lib/windows/manager.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { cn } from '$lib/utils';
	import DatabaseIcon from 'phosphor-svelte/lib/Database';
	import FlowArrowIcon from 'phosphor-svelte/lib/FlowArrow';
	import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';
	import PlugsIcon from 'phosphor-svelte/lib/Plugs';
	import GearSixIcon from 'phosphor-svelte/lib/GearSix';
	import CopyIcon from 'phosphor-svelte/lib/Copy';

	const links = [
		{ route: '/data', label: 'Data', icon: DatabaseIcon },
		{ route: '/workflows', label: 'Workflows', icon: FlowArrowIcon },
		{ route: '/dashboard', label: 'Dashboard', icon: SquaresFourIcon }
	] as const;

	function isActive(href: string): boolean {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}

	function openWindow(href: string) {
		window.open(href, '_blank', 'width=1280,height=860,noopener');
	}
</script>

<header
	class="bg-background/70 fixed inset-x-0 top-0 z-40 flex h-11 items-center gap-2 border-b px-3 backdrop-blur-xl"
>
	<a href={resolve('/')} class="text-sm font-semibold tracking-tight">Dashi</a>
	<nav class="ml-2 flex items-center gap-1">
		{#each links as link (link.route)}
			<a
				href={resolve(link.route)}
				class={cn(
					'text-muted-foreground hover:text-foreground flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
					isActive(link.route) && 'bg-accent text-foreground'
				)}
			>
				<link.icon size={14} />
				{link.label}
			</a>
		{/each}
	</nav>
	<div class="ml-auto flex items-center gap-0.5">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="ghost" size="sm" class="h-7 gap-1.5 px-2 text-xs">
						<CopyIcon size={14} />
						Split screen
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.GroupHeading>Open in a new window</DropdownMenu.GroupHeading>
				{#each links as link (link.route)}
					<DropdownMenu.Item onclick={() => openWindow(resolve(link.route))}>
						<link.icon size={14} />
						{link.label}
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			title="Connections"
			onclick={() => windowManager.toggle('connections')}
		>
			<PlugsIcon size={15} />
		</Button>
		<Button
			variant="ghost"
			size="icon"
			class="size-7"
			title="Dashboard settings"
			onclick={() => windowManager.toggle('settings')}
		>
			<GearSixIcon size={15} />
		</Button>
	</div>
</header>
