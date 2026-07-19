import type { Widget } from '$lib/widgets/types';
import type { Workflow } from '$lib/workflow/types';
import { mockConnectionId, mockCsvConnection, seedMockData } from '$lib/widgets/mock';
import { connectionsStore } from '$lib/connections/store.svelte';
import { workspaceStore } from './store.svelte';

const wf = 'example-sales';

const exampleWorkflow: Workflow = {
	id: wf,
	name: 'Sales overview',
	createdAt: 0,
	updatedAt: 0,
	nodes: [
		{
			id: 'src',
			kind: 'table',
			label: 'Sales table',
			position: { x: 0, y: 160 },
			config: { connectionId: mockConnectionId, tableName: 'mock_sales' }
		},
		{
			id: 'agg-month',
			kind: 'aggregate',
			label: 'Revenue by month',
			position: { x: 300, y: 40 },
			config: {
				groupBy: ['month'],
				aggregates: [{ fn: 'sum', column: 'revenue', alias: 'revenue' }]
			}
		},
		{
			id: 'agg-total',
			kind: 'aggregate',
			label: 'Total revenue',
			position: { x: 300, y: 300 },
			config: { groupBy: [], aggregates: [{ fn: 'sum', column: 'revenue', alias: 'total' }] }
		},
		{
			id: 'chart-month',
			kind: 'chart',
			label: 'Monthly revenue',
			position: { x: 620, y: 40 },
			config: { chartType: 'bar', x: 'month', y: 'revenue', colorScheme: 'blue' }
		},
		{
			id: 'grid-raw',
			kind: 'grid',
			label: 'Raw rows',
			position: { x: 620, y: 180 },
			config: { pageSize: 50 }
		},
		{
			id: 'metric-total',
			kind: 'metric',
			label: 'Total revenue',
			position: { x: 620, y: 320 },
			config: { column: 'total', label: 'Total revenue', prefix: '$' }
		}
	],
	edges: [
		{ id: 'e1', source: 'src', target: 'agg-month', targetHandle: 'in' },
		{ id: 'e2', source: 'src', target: 'agg-total', targetHandle: 'in' },
		{ id: 'e3', source: 'agg-month', target: 'chart-month', targetHandle: 'in' },
		{ id: 'e4', source: 'src', target: 'grid-raw', targetHandle: 'in' },
		{ id: 'e5', source: 'agg-total', target: 'metric-total', targetHandle: 'in' }
	]
};

const exampleWidgets: Widget[] = [
	{
		id: 'example-text',
		title: 'Overview',
		kind: 'text',
		layout: { x: 0, y: 0, w: 4, h: 2 },
		config: { content: 'Demo dashboard fed by the Sales overview workflow.' }
	},
	{
		id: 'example-metric',
		title: 'Total revenue',
		kind: 'viz',
		layout: { x: 0, y: 2, w: 4, h: 2 },
		config: { workflowId: wf, nodeId: 'metric-total' }
	},
	{
		id: 'example-chart',
		title: 'Monthly revenue',
		kind: 'viz',
		layout: { x: 4, y: 0, w: 8, h: 4 },
		config: { workflowId: wf, nodeId: 'chart-month' }
	},
	{
		id: 'example-grid',
		title: 'Raw data',
		kind: 'viz',
		layout: { x: 0, y: 4, w: 12, h: 4 },
		config: { workflowId: wf, nodeId: 'grid-raw' }
	}
];

export async function loadExampleWorkspace(): Promise<void> {
	await seedMockData();
	await connectionsStore.addMetadataOnly(mockCsvConnection);
	const now = Date.now();
	const workflow = structuredClone(exampleWorkflow);
	workflow.createdAt = now;
	workflow.updatedAt = now;
	if (!workspaceStore.workflowById(wf)) {
		workspaceStore.addWorkflow(workflow);
	} else {
		workspaceStore.updateWorkflow(workflow);
	}
	for (const widget of structuredClone(exampleWidgets)) {
		if (workspaceStore.widgets.some((existing) => existing.id === widget.id)) {
			workspaceStore.updateWidget(widget);
		} else {
			workspaceStore.addWidget(widget);
		}
	}
}

/** DuckDB-wasm tables don't survive a reload; re-seed if the example is present. */
export async function reseedExampleIfPresent(): Promise<void> {
	if (connectionsStore.connections.some((connection) => connection.id === mockConnectionId)) {
		await seedMockData();
	}
}
