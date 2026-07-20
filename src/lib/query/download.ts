import { runQueryWithColumns } from '$lib/duckdb/client';
import { viewName } from '$lib/workflow/engine';

function csvCell(value: unknown): string {
	if (value === null || value === undefined) return '';
	const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
	if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
	return text;
}

export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
	const header = columns.map(csvCell).join(',');
	const body = rows.map((row) => columns.map((column) => csvCell(row[column])).join(','));
	return [header, ...body].join('\n');
}

export function downloadBlob(name: string, mime: string, content: string | Blob): void {
	const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = name;
	anchor.click();
	URL.revokeObjectURL(url);
}

function safeName(label: string): string {
	return label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/^-|-$/g, '') || 'data';
}

/** Downloads the full result of a workflow node (must have been run first). */
export async function downloadNodeData(
	workflowId: string,
	nodeId: string,
	label: string,
	format: 'csv' | 'json'
): Promise<void> {
	const view = viewName(workflowId, nodeId);
	const { columns, rows } = await runQueryWithColumns(`select * from ${view}`);
	const name = safeName(label);
	if (format === 'csv') {
		downloadBlob(`${name}.csv`, 'text/csv', toCsv(columns, rows));
	} else {
		downloadBlob(
			`${name}.json`,
			'application/json',
			JSON.stringify(rows, (_key, value) => (typeof value === 'bigint' ? Number(value) : value), 2)
		);
	}
}
