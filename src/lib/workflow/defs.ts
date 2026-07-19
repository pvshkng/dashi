import type { NodeConfigMap, NodeKind } from './types';

export type NodeCategory = 'source' | 'transform' | 'output';

export interface InputHandle {
	id: string;
	label: string;
}

export interface NodeDef<K extends NodeKind = NodeKind> {
	kind: K;
	label: string;
	description: string;
	category: NodeCategory;
	inputs: InputHandle[];
	hasOutput: boolean;
	defaultConfig: () => NodeConfigMap[K];
}

const single: InputHandle[] = [{ id: 'in', label: 'in' }];

export const nodeDefs: { [K in NodeKind]: NodeDef<K> } = {
	table: {
		kind: 'table',
		label: 'Table',
		description: 'Read a table from a connection',
		category: 'source',
		inputs: [],
		hasOutput: true,
		defaultConfig: () => ({ connectionId: '', tableName: '' })
	},
	sql: {
		kind: 'sql',
		label: 'SQL query',
		description: 'Run a SQL query against a connection',
		category: 'source',
		inputs: [],
		hasOutput: true,
		defaultConfig: () => ({ connectionId: '', sql: 'select 1 as value' })
	},
	filter: {
		kind: 'filter',
		label: 'Filter',
		description: 'Keep rows matching conditions',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({ combinator: 'and', conditions: [] })
	},
	select: {
		kind: 'select',
		label: 'Select columns',
		description: 'Keep only chosen columns',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({ columns: [] })
	},
	formula: {
		kind: 'formula',
		label: 'Formula',
		description: 'Add a computed column',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({ alias: 'computed', expression: '' })
	},
	aggregate: {
		kind: 'aggregate',
		label: 'Aggregate',
		description: 'Group and summarize rows',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({
			groupBy: [],
			aggregates: [{ fn: 'count', column: '*', alias: 'count' }]
		})
	},
	join: {
		kind: 'join',
		label: 'Join',
		description: 'Combine two inputs on a key',
		category: 'transform',
		inputs: [
			{ id: 'left', label: 'L' },
			{ id: 'right', label: 'R' }
		],
		hasOutput: true,
		defaultConfig: () => ({ joinType: 'inner', leftKey: '', rightKey: '' })
	},
	union: {
		kind: 'union',
		label: 'Union',
		description: 'Stack two inputs with matching columns',
		category: 'transform',
		inputs: [
			{ id: 'a', label: 'A' },
			{ id: 'b', label: 'B' }
		],
		hasOutput: true,
		defaultConfig: () => ({ all: true })
	},
	sort: {
		kind: 'sort',
		label: 'Sort',
		description: 'Order rows by columns',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({ keys: [] })
	},
	limit: {
		kind: 'limit',
		label: 'Limit',
		description: 'Keep the first N rows',
		category: 'transform',
		inputs: single,
		hasOutput: true,
		defaultConfig: () => ({ count: 100, offset: 0 })
	},
	chart: {
		kind: 'chart',
		label: 'Chart',
		description: 'Visualize as a chart widget',
		category: 'output',
		inputs: single,
		hasOutput: false,
		defaultConfig: () => ({ chartType: 'line', x: '', y: '', colorScheme: 'blue' })
	},
	grid: {
		kind: 'grid',
		label: 'Table view',
		description: 'Show rows as a table widget',
		category: 'output',
		inputs: single,
		hasOutput: false,
		defaultConfig: () => ({ pageSize: 50 })
	},
	metric: {
		kind: 'metric',
		label: 'Metric',
		description: 'Show a single number widget',
		category: 'output',
		inputs: single,
		hasOutput: false,
		defaultConfig: () => ({ column: '', label: '' })
	}
};

export function getNodeDef(kind: NodeKind): NodeDef {
	return nodeDefs[kind] as NodeDef;
}

export const categoryOrder: NodeCategory[] = ['source', 'transform', 'output'];

export const categoryLabels: Record<NodeCategory, string> = {
	source: 'Sources',
	transform: 'Transforms',
	output: 'Outputs'
};

export function isVizKind(kind: NodeKind): kind is 'chart' | 'grid' | 'metric' {
	return nodeDefs[kind].category === 'output';
}
