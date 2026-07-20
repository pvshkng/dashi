import type { DataConnection } from '$lib/connections/types';
import { isLocalConnection } from '$lib/connections/types';
import { runQuery } from '$lib/duckdb/client';
import { aiSettings } from './settings.svelte';

/** Describes the locally registered tables so the model can write valid SQL. */
export async function buildSchemaContext(connections: DataConnection[]): Promise<string> {
	const lines: string[] = [];
	for (const connection of connections) {
		if (!isLocalConnection(connection)) continue;
		try {
			const columns = await runQuery(
				`describe "${connection.tableName.replaceAll('"', '""')}"`
			);
			const spec = columns
				.map((col) => `${String(col.column_name)} ${String(col.column_type)}`)
				.join(', ');
			lines.push(`table ${connection.tableName} (${spec})`);
		} catch {
			lines.push(`table ${connection.tableName}`);
		}
	}
	return lines.join('\n');
}

function stripFences(text: string): string {
	const match = text.match(/```(?:sql)?\s*([\s\S]*?)```/i);
	return (match ? match[1] : text).trim().replace(/;\s*$/, '');
}

/** Asks the configured OpenAI-compatible endpoint (any provider, incl. Ollama) for DuckDB SQL. */
export async function generateSql(question: string, schema: string): Promise<string> {
	const { endpoint, apiKey, model } = aiSettings.settings;
	if (!endpoint || !model) {
		throw new Error('Configure the AI endpoint and model in Settings first.');
	}
	const base = endpoint.replace(/\/+$/, '');
	const response = await fetch(`${base}/chat/completions`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
		},
		body: JSON.stringify({
			model,
			temperature: 0,
			messages: [
				{
					role: 'system',
					content:
						'You translate questions into a single DuckDB SQL query. Reply with only the SQL, no explanation. Available tables:\n' +
						(schema || '(no tables registered)')
				},
				{ role: 'user', content: question }
			]
		})
	});
	if (!response.ok) {
		const text = await response.text();
		throw new Error(`AI request failed (${response.status}): ${text.slice(0, 200)}`);
	}
	const data = (await response.json()) as {
		choices?: { message?: { content?: string } }[];
	};
	const content = data.choices?.[0]?.message?.content;
	if (!content) throw new Error('The AI returned an empty response.');
	return stripFences(content);
}
