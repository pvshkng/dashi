import * as duckdb from '@duckdb/duckdb-wasm';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let connPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

async function createDatabase(): Promise<duckdb.AsyncDuckDB> {
	const bundles = duckdb.getJsDelivrBundles();
	const bundle = await duckdb.selectBundle(bundles);

	const workerUrl = URL.createObjectURL(
		new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
	);

	const worker = new Worker(workerUrl);
	const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
	const db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
	URL.revokeObjectURL(workerUrl);

	return db;
}

export function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
	if (!dbPromise) {
		dbPromise = createDatabase();
	}
	return dbPromise;
}

/**
 * One shared connection for the whole app. Workflow nodes materialize as temp
 * views, which are connection-scoped in DuckDB, so every query must run on the
 * same connection or the views disappear between statements.
 */
export function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
	if (!connPromise) {
		connPromise = getDuckDB().then((db) => db.connect());
	}
	return connPromise;
}

export async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
	const conn = await getConnection();
	const result = await conn.query(sql);
	return result.toArray().map((row) => row.toJSON());
}

export interface LocalQueryResult {
	columns: string[];
	rows: Record<string, unknown>[];
}

/** Like runQuery, but keeps column order/names even for empty results. */
export async function runQueryWithColumns(sql: string): Promise<LocalQueryResult> {
	const conn = await getConnection();
	const result = await conn.query(sql);
	const columns = result.schema.fields.map((field) => field.name);
	const rows = result.toArray().map((row) => row.toJSON());
	return { columns, rows };
}

/** Materialize fetched rows (e.g. from a server connection) as a local table. */
export async function materializeRows(
	tableName: string,
	columns: string[],
	rows: Record<string, unknown>[]
): Promise<void> {
	const db = await getDuckDB();
	const conn = await getConnection();
	if (rows.length === 0) {
		const cols = columns.length > 0 ? columns : ['value'];
		const decl = cols.map((c) => `"${c.replaceAll('"', '""')}" varchar`).join(', ');
		await conn.query(`create or replace table "${tableName}" (${decl})`);
		return;
	}
	const fileName = `${tableName}.json`;
	await db.registerFileText(fileName, JSON.stringify(rows));
	await conn.query(
		`create or replace table "${tableName}" as select * from read_json_auto('${fileName}')`
	);
}
