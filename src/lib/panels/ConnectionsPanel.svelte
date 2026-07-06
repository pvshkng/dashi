<script lang="ts">
	import { connectionsStore } from '$lib/connections/store.svelte';
	import type { ConnectionKind, DataConnection } from '$lib/connections/types';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import PlusIcon from 'phosphor-svelte/lib/Plus';
	import TrashIcon from 'phosphor-svelte/lib/Trash';

	let dialogOpen = $state(false);
	let kind = $state<ConnectionKind>('csv');
	let name = $state('');
	let file: File | null = $state(null);
	let sheetName = $state('');
	let host = $state('localhost');
	let port = $state(5432);
	let database = $state('');
	let user = $state('');
	let password = $state('');
	let filePath = $state('');

	const kindLabels: Record<ConnectionKind, string> = {
		csv: 'CSV file',
		excel: 'Excel file',
		parquet: 'Parquet file',
		postgres: 'Postgres',
		sqlite: 'SQLite'
	};

	function resetForm() {
		name = '';
		file = null;
		sheetName = '';
		host = 'localhost';
		port = 5432;
		database = '';
		user = '';
		password = '';
		filePath = '';
	}

	function tableNameFrom(value: string): string {
		return value.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
	}

	async function createConnection() {
		const id = crypto.randomUUID();
		const createdAt = Date.now();

		if (kind === 'csv' || kind === 'excel' || kind === 'parquet') {
			if (!file) return;
			const tableName = tableNameFrom(file.name);
			await connectionsStore.addFileConnection(
				kind === 'excel'
					? {
							id,
							name: name || file.name,
							createdAt,
							kind,
							fileName: file.name,
							tableName,
							sheetName: sheetName || undefined
						}
					: { id, name: name || file.name, createdAt, kind, fileName: file.name, tableName },
				file
			);
		} else if (kind === 'postgres') {
			const connection = {
				id,
				name: name || database,
				createdAt,
				kind,
				host,
				port,
				database,
				user,
				password
			};
			await fetch('/api/connections', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(connection)
			});
			await connectionsStore.addServerConnection(connection);
		} else if (kind === 'sqlite') {
			const connection = { id, name: name || filePath, createdAt, kind, filePath };
			await fetch('/api/connections', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(connection)
			});
			await connectionsStore.addServerConnection(connection);
		}

		resetForm();
		dialogOpen = false;
	}

	async function removeConnection(connection: DataConnection) {
		if (connection.kind === 'postgres' || connection.kind === 'sqlite') {
			await fetch(`/api/connections?id=${connection.id}`, { method: 'DELETE' });
		}
		await connectionsStore.remove(connection.id);
	}
</script>

<div class="flex h-full flex-col gap-3 p-3">
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger>
			<Button class="w-full" variant="outline">
				<PlusIcon size={16} />
				New connection
			</Button>
		</Dialog.Trigger>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>New connection</Dialog.Title>
			</Dialog.Header>
			<div class="space-y-4">
				<div class="space-y-1">
					<Label>Type</Label>
					<Select.Root type="single" bind:value={kind}>
						<Select.Trigger>{kindLabels[kind]}</Select.Trigger>
						<Select.Content>
							{#each Object.entries(kindLabels) as [value, label] (value)}
								<Select.Item {value} {label} />
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-1">
					<Label>Name</Label>
					<Input bind:value={name} placeholder="My connection" />
				</div>
				{#if kind === 'csv' || kind === 'excel' || kind === 'parquet'}
					<div class="space-y-1">
						<Label>File</Label>
						<input
							type="file"
							accept={kind === 'csv' ? '.csv' : kind === 'excel' ? '.xlsx,.xls' : '.parquet'}
							onchange={(event) => {
								file = (event.target as HTMLInputElement).files?.[0] ?? null;
							}}
						/>
					</div>
					{#if kind === 'excel'}
						<div class="space-y-1">
							<Label>Sheet name (optional)</Label>
							<Input bind:value={sheetName} placeholder="Sheet1" />
						</div>
					{/if}
				{:else if kind === 'postgres'}
					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-1">
							<Label>Host</Label>
							<Input bind:value={host} />
						</div>
						<div class="space-y-1">
							<Label>Port</Label>
							<Input type="number" bind:value={port} />
						</div>
					</div>
					<div class="space-y-1">
						<Label>Database</Label>
						<Input bind:value={database} />
					</div>
					<div class="grid grid-cols-2 gap-2">
						<div class="space-y-1">
							<Label>User</Label>
							<Input bind:value={user} />
						</div>
						<div class="space-y-1">
							<Label>Password</Label>
							<Input type="password" bind:value={password} />
						</div>
					</div>
				{:else if kind === 'sqlite'}
					<div class="space-y-1">
						<Label>File path (server-accessible)</Label>
						<Input bind:value={filePath} placeholder="/path/to/database.sqlite" />
					</div>
				{/if}
			</div>
			<Dialog.Footer>
				<Button onclick={createConnection}>Create</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>

	<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
		{#each connectionsStore.connections as connection (connection.id)}
			<div class="flex items-center justify-between rounded-lg border px-3 py-2">
				<div class="min-w-0">
					<p class="truncate text-sm font-medium">{connection.name}</p>
					<p class="text-muted-foreground text-xs">{kindLabels[connection.kind]}</p>
				</div>
				<Button variant="ghost" size="icon" onclick={() => removeConnection(connection)}>
					<TrashIcon size={16} />
				</Button>
			</div>
		{/each}
		{#if connectionsStore.loaded && connectionsStore.connections.length === 0}
			<p class="text-muted-foreground text-sm">No connections yet.</p>
		{/if}
	</div>
</div>
