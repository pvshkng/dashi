import type { DataConnection } from '$lib/connections/types';
import { isServerConnection } from '$lib/connections/types';
import { runQuery } from '$lib/duckdb/client';

export interface QueryResult {
	columns: string[];
	rows: Record<string, unknown>[];
}

export async function executeQuery(connection: DataConnection, sql: string): Promise<QueryResult> {
	if (isServerConnection(connection)) {
		const response = await fetch('/api/query', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ connectionId: connection.id, sql })
		});
		const result = (await response.json()) as QueryResult & { error?: string };
		if (!response.ok) {
			throw new Error(result.error ?? 'query failed');
		}
		return result;
	}

	const rows = await runQuery(sql);
	const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
	return { columns, rows };
}
