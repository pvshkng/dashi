import * as duckdb from '@duckdb/duckdb-wasm';

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;

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

export async function runQuery(sql: string): Promise<Record<string, unknown>[]> {
	const db = await getDuckDB();
	const conn = await db.connect();
	try {
		const result = await conn.query(sql);
		return result.toArray().map((row) => row.toJSON());
	} finally {
		await conn.close();
	}
}
