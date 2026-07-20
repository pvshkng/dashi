<script lang="ts">
	import { connectionsStore } from '$lib/connections/store.svelte';
	import type { ConnectionKind, DataConnection, UrlFormat } from '$lib/connections/types';
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
	let url = $state('');
	let urlFormat = $state<UrlFormat>('csv');

	const kindLabels: Record<ConnectionKind, string> = {
		csv: 'CSV file',
		excel: 'Excel file',
		parquet: 'Parquet file',
		json: 'JSON file',
		url: 'Remote file (URL)',
		postgres: 'Postgres',
		mysql: 'MySQL',
		sqlite: 'SQLite',
		duckdb: 'DuckDB file'
	};

	function setKind(value: ConnectionKind) {
		kind = value;
		if (kind === 'mysql') port = 3306;
		else if (kind === 'postgres') port = 5432;
	}

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
		url = '';
		urlFormat = 'csv';
	}

	function guessUrlFormat(value: string): UrlFormat {
		const path = value.split('?')[0].toLowerCase();
		if (path.endsWith('.parquet')) return 'parquet';
		if (path.endsWith('.json') || path.endsWith('.ndjson') || path.endsWith('.jsonl'))
			return 'json';
		return 'csv';
	}

	function tableNameFrom(value: string): string {
		return value.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_');
	}

	async function createConnection() {
		const id = crypto.randomUUID();
		const createdAt = Date.now();

		if (kind === 'csv' || kind === 'excel' || kind === 'parquet' || kind === 'json') {
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
		} else if (kind === 'url') {
			if (!url) return;
			const fileName = url.split('?')[0].split('/').pop() || 'remote';
			await connectionsStore.addUrlConnection({
				id,
				name: name || fileName,
				createdAt,
				kind,
				url,
				format: urlFormat,
				tableName: tableNameFrom(fileName)
			});
		} else if (kind === 'postgres' || kind === 'mysql') {
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
		} else if (kind === 'sqlite' || kind === 'duckdb') {
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
		if (
			connection.kind === 'postgres' ||
			connection.kind === 'mysql' ||
			connection.kind === 'sqlite' ||
			connection.kind === 'duckdb'
		) {
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
					<Select.Root
						type="single"
						value={kind}
						onValueChange={(value) => setKind(value as ConnectionKind)}
					>
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
				{#if kind === 'csv' || kind === 'excel' || kind === 'parquet' || kind === 'json'}
					<div class="space-y-1">
						<Label>File</Label>
						<input
							type="file"
							accept={kind === 'csv'
								? '.csv'
								: kind === 'excel'
									? '.xlsx,.xls'
									: kind === 'json'
										? '.json,.ndjson,.jsonl'
										: '.parquet'}
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
				{:else if kind === 'url'}
					<div class="space-y-1">
						<Label>File URL</Label>
						<Input
							bind:value={url}
							placeholder="https://example.com/data.parquet"
							oninput={() => (urlFormat = guessUrlFormat(url))}
						/>
						<p class="text-muted-foreground text-xs">
							Read directly by DuckDB over https — CSV, Parquet, JSON. Nothing is uploaded.
						</p>
					</div>
					<div class="space-y-1">
						<Label>Format</Label>
						<Select.Root
							type="single"
							value={urlFormat}
							onValueChange={(value) => (urlFormat = value as UrlFormat)}
						>
							<Select.Trigger>{urlFormat}</Select.Trigger>
							<Select.Content>
								<Select.Item value="csv" label="csv" />
								<Select.Item value="parquet" label="parquet" />
								<Select.Item value="json" label="json" />
							</Select.Content>
						</Select.Root>
					</div>
				{:else if kind === 'postgres' || kind === 'mysql'}
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
				{:else if kind === 'sqlite' || kind === 'duckdb'}
					<div class="space-y-1">
						<Label>File path (server-accessible)</Label>
						<Input
							bind:value={filePath}
							placeholder={kind === 'duckdb'
								? '/path/to/database.duckdb'
								: '/path/to/database.sqlite'}
						/>
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
