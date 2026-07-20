import * as XLSX from 'xlsx';
import { getConnection, getDuckDB } from './client';
import type { FileConnection, UrlConnection } from '$lib/connections/types';

async function excelToCsvBuffer(buffer: ArrayBuffer, sheetName?: string): Promise<Uint8Array> {
	const workbook = XLSX.read(buffer, { type: 'array' });
	const targetSheet = sheetName ?? workbook.SheetNames[0];
	const sheet = workbook.Sheets[targetSheet];
	const csv = XLSX.utils.sheet_to_csv(sheet);
	return new TextEncoder().encode(csv);
}

function readerFor(format: 'csv' | 'parquet' | 'json', path: string): string {
	const safe = path.replaceAll("'", "''");
	if (format === 'parquet') return `read_parquet('${safe}')`;
	if (format === 'json') return `read_json_auto('${safe}')`;
	return `read_csv_auto('${safe}')`;
}

export async function registerFileBlob(connection: FileConnection, blob: Blob): Promise<void> {
	const db = await getDuckDB();
	const buffer = await blob.arrayBuffer();
	const conn = await getConnection();

	let bytes: Uint8Array = new Uint8Array(buffer);
	let format: 'csv' | 'parquet' | 'json' = 'csv';
	if (connection.kind === 'excel') {
		bytes = await excelToCsvBuffer(buffer, connection.sheetName);
	} else if (connection.kind === 'parquet') {
		format = 'parquet';
	} else if (connection.kind === 'json') {
		format = 'json';
	}

	await db.registerFileBuffer(connection.fileName, bytes);
	await conn.query(
		`create or replace table ${connection.tableName} as select * from ${readerFor(format, connection.fileName)}`
	);
}

export async function registerUrlConnection(connection: UrlConnection): Promise<void> {
	const conn = await getConnection();
	await conn.query(
		`create or replace view ${connection.tableName} as select * from ${readerFor(connection.format, connection.url)}`
	);
}
