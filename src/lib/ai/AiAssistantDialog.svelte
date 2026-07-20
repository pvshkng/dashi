<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { connectionsStore } from '$lib/connections/store.svelte';
	import { windowManager } from '$lib/windows/manager.svelte';
	import { aiSettings } from './settings.svelte';
	import { buildSchemaContext, generateSql } from './nl2sql';
	import SparkleIcon from 'phosphor-svelte/lib/Sparkle';
	import CircleNotchIcon from 'phosphor-svelte/lib/CircleNotch';

	let {
		open = $bindable(false),
		onAccept
	}: {
		open?: boolean;
		onAccept: (sql: string, question: string) => void;
	} = $props();

	let question = $state('');
	let sql = $state('');
	let busy = $state(false);
	let error = $state<string | null>(null);

	$effect(() => {
		if (open) void aiSettings.load();
	});

	async function generate() {
		if (!question.trim() || busy) return;
		busy = true;
		error = null;
		try {
			const schema = await buildSchemaContext(connectionsStore.connections);
			sql = await generateSql(question, schema);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Generation failed.';
		} finally {
			busy = false;
		}
	}

	function accept() {
		if (!sql.trim()) return;
		onAccept(sql, question);
		open = false;
		question = '';
		sql = '';
		error = null;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-lg">
		<Dialog.Header>
			<Dialog.Title>Ask AI</Dialog.Title>
			<Dialog.Description>
				Describe what you want to see; the answer becomes an editable SQL node. Works with any
				OpenAI-compatible endpoint, including local Ollama.
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-3">
			{#if aiSettings.loaded && !aiSettings.configured}
				<p class="text-muted-foreground text-xs">
					No AI endpoint configured.
					<button
						type="button"
						class="text-foreground underline underline-offset-2"
						onclick={() => windowManager.open('settings')}
					>
						Open Settings
					</button>
					and set an endpoint (e.g. <code class="font-mono">http://localhost:11434/v1</code>) and
					model.
				</p>
			{/if}
			<div class="space-y-1">
				<Label class="text-xs">Question</Label>
				<Textarea
					bind:value={question}
					rows={3}
					class="text-xs"
					placeholder="Total revenue by month for 2024, sorted descending"
				/>
			</div>
			{#if sql}
				<div class="space-y-1">
					<Label class="text-xs">Generated SQL — edit before adding if needed</Label>
					<Textarea bind:value={sql} rows={6} class="font-mono text-xs" />
				</div>
			{/if}
			{#if error}
				<p class="text-destructive text-xs whitespace-pre-wrap">{error}</p>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" disabled={busy || !question.trim()} onclick={generate}>
				{#if busy}
					<CircleNotchIcon size={14} class="animate-spin" />
				{:else}
					<SparkleIcon size={14} />
				{/if}
				{sql ? 'Regenerate' : 'Generate SQL'}
			</Button>
			<Button disabled={!sql.trim()} onclick={accept}>Add as SQL node</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
