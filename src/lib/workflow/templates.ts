import type { Widget } from '$lib/widgets/types';
import type { ChartNodeConfig, Workflow, WorkflowEdge, WorkflowNode } from './types';
import { mockConnectionId, mockCsvConnection, seedMockData } from '$lib/widgets/mock';
import { installSampleById, sampleConnectionId } from '$lib/data/sampleDatasets';
import { connectionsStore } from '$lib/connections/store.svelte';
import { workspaceStore } from '$lib/workspace/store.svelte';

export type ThumbKind = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'metric' | 'table';

export interface WorkflowTemplate {
	id: string;
	name: string;
	description: string;
	thumb: ThumbKind;
	dataLabel: string;
	datasetId?: string;
	usesMock?: boolean;
	primaryNodeId: string;
	widgetSize: { w: number; h: number };
	build: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[] };
}

function chain(nodes: WorkflowNode[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
	const edges = nodes.slice(1).map((node, index) => ({
		id: `e${index}`,
		source: nodes[index].id,
		target: node.id,
		targetHandle: 'in'
	}));
	return { nodes, edges };
}

function at(index: number): { x: number; y: number } {
	return { x: index * 280, y: 120 };
}

function tableNode(connectionId: string, tableName: string, label: string): WorkflowNode {
	return { id: 'src', kind: 'table', label, position: at(0), config: { connectionId, tableName } };
}

function sqlNode(sql: string, label: string): WorkflowNode {
	return { id: 'src', kind: 'sql', label, position: at(0), config: { connectionId: '', sql } };
}

export const workflowTemplates: WorkflowTemplate[] = [
	{
		id: 'monthly-revenue',
		name: 'Monthly revenue',
		description: 'Bar chart of revenue summed per month.',
		thumb: 'bar',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Sum by month',
					position: at(1),
					config: {
						groupBy: ['month'],
						aggregates: [{ fn: 'sum', column: 'revenue', alias: 'revenue' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Monthly revenue',
					position: at(2),
					config: { chartType: 'bar', x: 'month', y: 'revenue', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'revenue-by-region',
		name: 'Revenue by region',
		description: 'Pie chart splitting revenue across regions.',
		thumb: 'pie',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 4, h: 4 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Sum by region',
					position: at(1),
					config: {
						groupBy: ['region'],
						aggregates: [{ fn: 'sum', column: 'revenue', alias: 'revenue' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Revenue by region',
					position: at(2),
					config: { chartType: 'pie', x: 'region', y: 'revenue', colorScheme: 'sunset' }
				}
			])
	},
	{
		id: 'units-vs-revenue',
		name: 'Units vs revenue',
		description: 'Scatter plot correlating units sold with revenue.',
		thumb: 'scatter',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'out',
					kind: 'chart',
					label: 'Units vs revenue',
					position: at(1),
					config: { chartType: 'scatter', x: 'units', y: 'revenue', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'total-revenue',
		name: 'Total revenue',
		description: 'Single number metric of overall revenue.',
		thumb: 'metric',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 3, h: 2 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Total',
					position: at(1),
					config: { groupBy: [], aggregates: [{ fn: 'sum', column: 'revenue', alias: 'total' }] }
				},
				{
					id: 'out',
					kind: 'metric',
					label: 'Total revenue',
					position: at(2),
					config: { column: 'total', label: 'Total revenue', prefix: '$' }
				}
			])
	},
	{
		id: 'revenue-trend',
		name: 'Revenue trend',
		description: 'Area chart of total revenue over the months.',
		thumb: 'area',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select strptime(month || ' 2024', '%b %Y')::date as month, sum(revenue) as revenue\nfrom mock_sales\ngroup by 1\norder by 1`,
					'Revenue by month'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'Revenue trend',
					position: at(1),
					config: { chartType: 'area', x: 'month', y: 'revenue', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'monthly-units',
		name: 'Units sold trend',
		description: 'Line chart of units sold per month.',
		thumb: 'line',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select strptime(month || ' 2024', '%b %Y')::date as month, sum(units) as units\nfrom mock_sales\ngroup by 1\norder by 1`,
					'Units by month'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'Units sold',
					position: at(1),
					config: { chartType: 'line', x: 'month', y: 'units', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'units-by-region',
		name: 'Units by region',
		description: 'Bar chart of units sold per region.',
		thumb: 'bar',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Sum by region',
					position: at(1),
					config: {
						groupBy: ['region'],
						aggregates: [{ fn: 'sum', column: 'units', alias: 'units' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Units by region',
					position: at(2),
					config: { chartType: 'bar', x: 'region', y: 'units', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'total-units',
		name: 'Total units',
		description: 'Single number metric of units sold.',
		thumb: 'metric',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 3, h: 2 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Total',
					position: at(1),
					config: { groupBy: [], aggregates: [{ fn: 'sum', column: 'units', alias: 'total' }] }
				},
				{
					id: 'out',
					kind: 'metric',
					label: 'Total units',
					position: at(2),
					config: { column: 'total', label: 'Units sold' }
				}
			])
	},
	{
		id: 'avg-sale-value',
		name: 'Average sale value',
		description: 'Revenue per unit sold as a single number.',
		thumb: 'metric',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 3, h: 2 },
		build: () =>
			chain([
				sqlNode(
					`select round(sum(revenue) * 1.0 / sum(units), 2) as avg_value from mock_sales`,
					'Revenue per unit'
				),
				{
					id: 'out',
					kind: 'metric',
					label: 'Average sale value',
					position: at(1),
					config: { column: 'avg_value', label: 'Per unit', prefix: '$' }
				}
			])
	},
	{
		id: 'north-share',
		name: 'North region share',
		description: 'Share of revenue coming from the North region.',
		thumb: 'metric',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 3, h: 2 },
		build: () =>
			chain([
				sqlNode(
					`select round(100.0 * sum(revenue) filter (where region = 'North') / sum(revenue)) as share\nfrom mock_sales`,
					'North share'
				),
				{
					id: 'out',
					kind: 'metric',
					label: 'North share',
					position: at(1),
					config: { column: 'share', label: 'Revenue from North', suffix: '%' }
				}
			])
	},
	{
		id: 'sales-table',
		name: 'Sales table',
		description: 'Browsable table of the raw sales rows.',
		thumb: 'table',
		dataLabel: 'Mock sales',
		usesMock: true,
		primaryNodeId: 'out',
		widgetSize: { w: 12, h: 4 },
		build: () =>
			chain([
				tableNode(mockConnectionId, 'mock_sales', 'Sales table'),
				{
					id: 'out',
					kind: 'grid',
					label: 'Sales rows',
					position: at(1),
					config: { pageSize: 10 }
				}
			])
	},
	{
		id: 'gdp-top-economies',
		name: 'Largest economies',
		description: 'Bar chart of GDP for the ten largest economies in 2016.',
		thumb: 'bar',
		dataLabel: 'World Bank GDP',
		datasetId: 'gdp',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select "Country Code" as country, round("Value" / 1e12, 2) as gdp_trillions\nfrom gdp\nwhere "Year" = 2016\n  and "Country Code" in ('USA','CHN','JPN','DEU','GBR','FRA','IND','ITA','BRA','CAN')\norder by gdp_trillions desc`,
					'Top economies 2016'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'GDP in trillion USD',
					position: at(1),
					config: { chartType: 'bar', x: 'country', y: 'gdp_trillions', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'world-population',
		name: 'World population growth',
		description: 'Line chart of the world population since 1960.',
		thumb: 'line',
		dataLabel: 'World Bank population',
		datasetId: 'population',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('population'), 'population', 'Population table'),
				{
					id: 'flt',
					kind: 'filter',
					label: 'World only',
					position: at(1),
					config: {
						combinator: 'and',
						conditions: [{ column: 'Country Name', op: 'eq', value: 'World' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'World population',
					position: at(2),
					config: { chartType: 'line', x: 'Year', y: 'Value', colorScheme: 'forest' }
				}
			])
	},
	{
		id: 'world-population-now',
		name: 'World population metric',
		description: 'Latest world population as a single number.',
		thumb: 'metric',
		dataLabel: 'World Bank population',
		datasetId: 'population',
		primaryNodeId: 'out',
		widgetSize: { w: 3, h: 2 },
		build: () =>
			chain([
				sqlNode(
					`select max_by("Value", "Year") as people from population where "Country Name" = 'World'`,
					'Latest world population'
				),
				{
					id: 'out',
					kind: 'metric',
					label: 'World population',
					position: at(1),
					config: { column: 'people', label: 'World population' }
				}
			])
	},
	{
		id: 'co2-emissions',
		name: 'CO2 emissions history',
		description: 'Area chart of global fossil fuel emissions since 1900.',
		thumb: 'area',
		dataLabel: 'Global CO2 emissions',
		datasetId: 'co2_global',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('co2_global'), 'co2_global', 'Emissions table'),
				{
					id: 'flt',
					kind: 'filter',
					label: 'Since 1900',
					position: at(1),
					config: { combinator: 'and', conditions: [{ column: 'Year', op: 'gte', value: '1900' }] }
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Global emissions',
					position: at(2),
					config: { chartType: 'area', x: 'Year', y: 'Total', colorScheme: 'forest' }
				}
			])
	},
	{
		id: 'co2-concentration',
		name: 'CO2 concentration',
		description: 'The Keeling curve: monthly atmospheric CO2 since 1958.',
		thumb: 'line',
		dataLabel: 'Mauna Loa CO2',
		datasetId: 'co2_concentration',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('co2_concentration'), 'co2_concentration', 'CO2 table'),
				{
					id: 'out',
					kind: 'chart',
					label: 'Atmospheric CO2 (ppm)',
					position: at(1),
					config: { chartType: 'line', x: 'Date', y: 'CO2', colorScheme: 'forest' }
				}
			])
	},
	{
		id: 'seattle-temperature',
		name: 'Seattle temperatures',
		description: 'Monthly average high temperature in Seattle.',
		thumb: 'line',
		dataLabel: 'Seattle weather',
		datasetId: 'seattle_weather',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select date_trunc('month', "date") as month, round(avg(temp_max), 1) as avg_high\nfrom seattle_weather\ngroup by 1\norder by 1`,
					'Monthly averages'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'Average high (°C)',
					position: at(1),
					config: { chartType: 'line', x: 'month', y: 'avg_high', colorScheme: 'sunset' }
				}
			])
	},
	{
		id: 'seattle-rain',
		name: 'Rainfall by weather type',
		description: 'Average precipitation grouped by observed weather.',
		thumb: 'bar',
		dataLabel: 'Seattle weather',
		datasetId: 'seattle_weather',
		primaryNodeId: 'out',
		widgetSize: { w: 4, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('seattle_weather'), 'seattle_weather', 'Weather table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Avg precipitation',
					position: at(1),
					config: {
						groupBy: ['weather'],
						aggregates: [{ fn: 'avg', column: 'precipitation', alias: 'avg_precipitation' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Rain by weather type',
					position: at(2),
					config: { chartType: 'bar', x: 'weather', y: 'avg_precipitation', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'disaster-deaths',
		name: 'Disaster deaths',
		description: 'Deaths from all natural disasters per year since 1980.',
		thumb: 'bar',
		dataLabel: 'Natural disasters',
		datasetId: 'disasters',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('disasters'), 'disasters', 'Disasters table'),
				{
					id: 'flt',
					kind: 'filter',
					label: 'All disasters, recent',
					position: at(1),
					config: {
						combinator: 'and',
						conditions: [
							{ column: 'Entity', op: 'eq', value: 'All natural disasters' },
							{ column: 'Year', op: 'gte', value: '1980' }
						]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Deaths per year',
					position: at(2),
					config: { chartType: 'bar', x: 'Year', y: 'Deaths', colorScheme: 'grayscale' }
				}
			])
	},
	{
		id: 'stock-prices',
		name: 'Tech stock prices',
		description: 'Line chart comparing five tech stocks over a decade.',
		thumb: 'line',
		dataLabel: 'Tech stocks',
		datasetId: 'stocks',
		primaryNodeId: 'out',
		widgetSize: { w: 8, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select symbol, strptime("date", '%b %-d %Y')::date as month, price from stocks order by month`,
					'Parse stock dates'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'Stock prices',
					position: at(1),
					config: {
						chartType: 'line',
						x: 'month',
						y: 'price',
						series: 'symbol',
						colorScheme: 'blue'
					}
				}
			])
	},
	{
		id: 'sp500-trend',
		name: 'S&P 500 trend',
		description: 'Area chart of the index through the dot-com and 2008 crashes.',
		thumb: 'area',
		dataLabel: 'S&P 500',
		datasetId: 'sp500',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				sqlNode(
					`select strptime("date", '%b %-d %Y')::date as month, price from sp500 order by month`,
					'Parse index dates'
				),
				{
					id: 'out',
					kind: 'chart',
					label: 'S&P 500',
					position: at(1),
					config: { chartType: 'area', x: 'month', y: 'price', colorScheme: 'grayscale' }
				}
			])
	},
	{
		id: 'us-jobs',
		name: 'US employment',
		description: 'Total nonfarm jobs through the 2008 recession.',
		thumb: 'area',
		dataLabel: 'US employment',
		datasetId: 'us_employment',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('us_employment'), 'us_employment', 'Employment table'),
				{
					id: 'out',
					kind: 'chart',
					label: 'Nonfarm jobs (thousands)',
					position: at(1),
					config: { chartType: 'area', x: 'month', y: 'nonfarm', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'iowa-energy-mix',
		name: 'Iowa energy mix',
		description: 'Pie chart of net power generation by source.',
		thumb: 'pie',
		dataLabel: 'Iowa electricity',
		datasetId: 'iowa_electricity',
		primaryNodeId: 'out',
		widgetSize: { w: 4, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('iowa_electricity'), 'iowa_electricity', 'Generation table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Sum by source',
					position: at(1),
					config: {
						groupBy: ['source'],
						aggregates: [{ fn: 'sum', column: 'net_generation', alias: 'net_generation' }]
					}
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Generation by source',
					position: at(2),
					config: { chartType: 'pie', x: 'source', y: 'net_generation', colorScheme: 'forest' }
				}
			])
	},
	{
		id: 'airports-by-state',
		name: 'Airports by state',
		description: 'Bar chart of the fifteen states with the most airports.',
		thumb: 'bar',
		dataLabel: 'US airports',
		datasetId: 'airports',
		primaryNodeId: 'out',
		widgetSize: { w: 6, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('airports'), 'airports', 'Airports table'),
				{
					id: 'agg',
					kind: 'aggregate',
					label: 'Count by state',
					position: at(1),
					config: {
						groupBy: ['state'],
						aggregates: [{ fn: 'count', column: '*', alias: 'airports' }]
					}
				},
				{
					id: 'srt',
					kind: 'sort',
					label: 'Most first',
					position: at(2),
					config: { keys: [{ column: 'airports', dir: 'desc' }] }
				},
				{
					id: 'lim',
					kind: 'limit',
					label: 'Top 15',
					position: at(3),
					config: { count: 15, offset: 0 }
				},
				{
					id: 'out',
					kind: 'chart',
					label: 'Airports by state',
					position: { x: 4 * 280, y: 120 },
					config: { chartType: 'bar', x: 'state', y: 'airports', colorScheme: 'blue' }
				}
			])
	},
	{
		id: 'airport-directory',
		name: 'Airport directory',
		description: 'Browsable table of every US airport.',
		thumb: 'table',
		dataLabel: 'US airports',
		datasetId: 'airports',
		primaryNodeId: 'out',
		widgetSize: { w: 12, h: 4 },
		build: () =>
			chain([
				tableNode(sampleConnectionId('airports'), 'airports', 'Airports table'),
				{
					id: 'out',
					kind: 'grid',
					label: 'Airport directory',
					position: at(1),
					config: { pageSize: 50 }
				}
			])
	}
];

export function templateById(id: string): WorkflowTemplate | undefined {
	return workflowTemplates.find((template) => template.id === id);
}

/** Downloads or seeds whatever data the template reads from. */
export async function ensureTemplateData(template: WorkflowTemplate): Promise<void> {
	if (template.usesMock) {
		await seedMockData();
		await connectionsStore.addMetadataOnly({ ...mockCsvConnection });
	}
	if (template.datasetId) {
		await installSampleById(template.datasetId);
	}
}

export async function instantiateTemplate(
	template: WorkflowTemplate,
	options: { workflowId?: string; chartScheme?: string } = {}
): Promise<Workflow> {
	await ensureTemplateData(template);
	const now = Date.now();
	const { nodes, edges } = template.build();
	if (options.chartScheme) {
		for (const node of nodes) {
			if (node.kind === 'chart') {
				(node.config as ChartNodeConfig).colorScheme = options.chartScheme;
			}
		}
	}
	const workflow: Workflow = {
		id: options.workflowId ?? crypto.randomUUID(),
		name: template.name,
		createdAt: now,
		updatedAt: now,
		nodes,
		edges
	};
	const existing = workspaceStore.workflowById(workflow.id);
	if (existing) {
		workspaceStore.updateWorkflow(workflow);
	} else {
		workspaceStore.addWorkflow(workflow);
	}
	return workflow;
}

/** One click: data + workflow + dashboard widget. */
export async function addTemplateToDashboard(template: WorkflowTemplate): Promise<Widget> {
	const workflow = await instantiateTemplate(template);
	const bottom = Math.max(0, ...workspaceStore.widgets.map((w) => w.layout.y + w.layout.h));
	const widget: Widget = {
		id: crypto.randomUUID(),
		title: template.name,
		kind: 'viz',
		layout: { x: 0, y: bottom, ...template.widgetSize },
		config: { workflowId: workflow.id, nodeId: template.primaryNodeId }
	};
	workspaceStore.addWidget(widget);
	return widget;
}
