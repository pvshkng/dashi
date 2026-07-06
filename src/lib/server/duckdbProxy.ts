import { DuckDBInstance } from '@duckdb/node-api';
import type { PostgresConnection, SqliteConnection } from '$lib/connections/types';

interface QueryResult {
	columns: string[];
	rows: Record<string, unknown>[];
}

async function runOnAttachedDatabase(setup: string[], sql: string): Promise<QueryResult> {
	const instance = await DuckDBInstance.create(':memory:');
	const connection = await instance.connect();
	try {
		for (const statement of setup) {
			await connection.run(statement);
		}
		const reader = await connection.runAndReadAll(sql);
		const columns = reader.columnNames();
		const rows = reader.getRowObjectsJson() as Record<string, unknown>[];
		return { columns, rows };
	} finally {
		connection.closeSync();
		instance.closeSync();
	}
}

export async function queryPostgres(
	connection: PostgresConnection,
	sql: string
): Promise<QueryResult> {
	const dsn = `host=${connection.host} port=${connection.port} dbname=${connection.database} user=${connection.user} password=${connection.password}`;
	return runOnAttachedDatabase(
		[
			'install postgres',
			'load postgres',
			`attach '${dsn}' as pg (type postgres, read_only)`,
			'use pg'
		],
		sql
	);
}

export async function querySqlite(connection: SqliteConnection, sql: string): Promise<QueryResult> {
	return runOnAttachedDatabase(
		[
			'install sqlite',
			'load sqlite',
			`attach '${connection.filePath}' as lite (type sqlite, read_only)`,
			'use lite'
		],
		sql
	);
}
