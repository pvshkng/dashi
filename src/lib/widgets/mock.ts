import type { CsvConnection } from '$lib/connections/types';
import { getDuckDB } from '$lib/duckdb/client';

export const mockConnectionId = 'mock-sales';

export interface MockRow {
	month: string;
	region: string;
	revenue: number;
	units: number;
}

export const mockRows: MockRow[] = [
	{ month: 'Jan', region: 'North', revenue: 12000, units: 120 },
	{ month: 'Feb', region: 'North', revenue: 15000, units: 140 },
	{ month: 'Mar', region: 'North', revenue: 13000, units: 130 },
	{ month: 'Apr', region: 'North', revenue: 18000, units: 160 },
	{ month: 'May', region: 'North', revenue: 17200, units: 155 },
	{ month: 'Jun', region: 'North', revenue: 19600, units: 172 },
	{ month: 'Jan', region: 'South', revenue: 9000, units: 90 },
	{ month: 'Feb', region: 'South', revenue: 9800, units: 95 },
	{ month: 'Mar', region: 'South', revenue: 11000, units: 105 },
	{ month: 'Apr', region: 'South', revenue: 12500, units: 118 },
	{ month: 'May', region: 'South', revenue: 13800, units: 126 },
	{ month: 'Jun', region: 'South', revenue: 12900, units: 121 },
	{ month: 'Jan', region: 'West', revenue: 7600, units: 70 },
	{ month: 'Feb', region: 'West', revenue: 8400, units: 78 },
	{ month: 'Mar', region: 'West', revenue: 10100, units: 92 },
	{ month: 'Apr', region: 'West', revenue: 9700, units: 88 },
	{ month: 'May', region: 'West', revenue: 11900, units: 104 },
	{ month: 'Jun', region: 'West', revenue: 14300, units: 128 }
];

export const mockCsvConnection: CsvConnection = {
	id: mockConnectionId,
	name: 'Mock Sales Data',
	createdAt: Date.now(),
	kind: 'csv',
	fileName: 'mock_sales.csv',
	tableName: 'mock_sales'
};

export async function seedMockData(): Promise<void> {
	const db = await getDuckDB();
	const conn = await db.connect();
	try {
		const values = mockRows
			.map((row) => `('${row.month}', '${row.region}', ${row.revenue}, ${row.units})`)
			.join(', ');
		await conn.query(
			`create or replace table mock_sales (month varchar, region varchar, revenue integer, units integer)`
		);
		await conn.query(`insert into mock_sales values ${values}`);
	} finally {
		await conn.close();
	}
}
