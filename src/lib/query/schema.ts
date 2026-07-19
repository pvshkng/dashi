import type { DataConnection } from '$lib/connections/types';
import { isFileConnection } from '$lib/connections/types';
import { executeQuery } from './executeQuery';

export interface ColumnInfo {
	name: string;
	type: string;
}

export async function listTables(connection: DataConnection): Promise<string[]> {
	if (isFileConnection(connection)) return [connection.tableName];
	const result = await executeQuery(
		connection,
		`select table_name from information_schema.tables where table_schema not in ('information_schema', 'pg_catalog') order by table_name`
	);
	return result.rows.map((row) => String(row.table_name));
}

export async function listColumns(
	connection: DataConnection,
	table: string
): Promise<ColumnInfo[]> {
	const safe = table.replaceAll('"', '""');
	const result = await executeQuery(connection, `describe "${safe}"`);
	return result.rows.map((row) => ({
		name: String(row.column_name),
		type: String(row.column_type)
	}));
}
