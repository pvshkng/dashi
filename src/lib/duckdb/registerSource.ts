import * as XLSX from 'xlsx';
import { getDuckDB } from './client';
import type { CsvConnection, ExcelConnection, ParquetConnection } from '$lib/connections/types';

async function excelToCsvBuffer(buffer: ArrayBuffer, sheetName?: string): Promise<Uint8Array> {
	const workbook = XLSX.read(buffer, { type: 'array' });
	const targetSheet = sheetName ?? workbook.SheetNames[0];
	const sheet = workbook.Sheets[targetSheet];
	const csv = XLSX.utils.sheet_to_csv(sheet);
	return new TextEncoder().encode(csv);
}

export async function registerFileBlob(
	connection: CsvConnection | ExcelConnection | ParquetConnection,
	blob: Blob
): Promise<void> {
	const db = await getDuckDB();
	const buffer = await blob.arrayBuffer();

	if (connection.kind === 'csv') {
		await db.registerFileBuffer(connection.fileName, new Uint8Array(buffer));
		const conn = await db.connect();
		await conn.query(
			`create or replace table ${connection.tableName} as select * from read_csv_auto('${connection.fileName}')`
		);
		await conn.close();
		return;
	}

	if (connection.kind === 'excel') {
		const csvBuffer = await excelToCsvBuffer(buffer, connection.sheetName);
		await db.registerFileBuffer(connection.fileName, csvBuffer);
		const conn = await db.connect();
		await conn.query(
			`create or replace table ${connection.tableName} as select * from read_csv_auto('${connection.fileName}')`
		);
		await conn.close();
		return;
	}

	await db.registerFileBuffer(connection.fileName, new Uint8Array(buffer));
	const conn = await db.connect();
	await conn.query(
		`create or replace table ${connection.tableName} as select * from read_parquet('${connection.fileName}')`
	);
	await conn.close();
}
