import { describe, expect, it } from 'vitest';
import { compileTransform, interpolateParams, topologicalOrder, wouldCycle } from './engine';
import type { NodeConfigMap, NodeKind, Workflow, WorkflowNode } from './types';

function workflow(nodes: string[], edges: [string, string][]): Workflow {
	return {
		id: 'wf',
		name: 'test',
		createdAt: 0,
		updatedAt: 0,
		nodes: nodes.map((id) => ({
			id,
			kind: 'limit',
			label: id,
			position: { x: 0, y: 0 },
			config: { count: 10, offset: 0 }
		})),
		edges: edges.map(([source, target], index) => ({ id: `e${index}`, source, target }))
	};
}

describe('topologicalOrder', () => {
	it('orders nodes so sources come before their dependents', () => {
		const order = topologicalOrder(
			workflow(
				['chart', 'agg', 'src'],
				[
					['src', 'agg'],
					['agg', 'chart']
				]
			)
		);
		expect(order.indexOf('src')).toBeLessThan(order.indexOf('agg'));
		expect(order.indexOf('agg')).toBeLessThan(order.indexOf('chart'));
	});

	it('throws on cycles', () => {
		expect(() =>
			topologicalOrder(
				workflow(
					['a', 'b'],
					[
						['a', 'b'],
						['b', 'a']
					]
				)
			)
		).toThrow(/cycle/i);
	});

	it('ignores edges pointing at removed nodes', () => {
		const wf = workflow(['a', 'b'], [['a', 'b']]);
		wf.edges.push({ id: 'stale', source: 'b', target: 'gone' });
		expect(topologicalOrder(wf)).toHaveLength(2);
	});
});

function node<K extends NodeKind>(kind: K, config: NodeConfigMap[K]): WorkflowNode<K> {
	return { id: 'n', kind, label: kind, position: { x: 0, y: 0 }, config };
}

const input = { in: 'src' };

describe('compileTransform', () => {
	it('compiles window running totals', () => {
		const sql = compileTransform(
			node('window', {
				fn: 'cumulative_sum',
				valueColumn: 'sales',
				partitionBy: ['region'],
				orderBy: 'month',
				alias: 'running',
				windowSize: 7
			}),
			input
		);
		expect(sql).toContain('sum("sales") over (partition by "region" order by "month" rows unbounded preceding)');
	});

	it('compiles moving averages with a bounded frame', () => {
		const sql = compileTransform(
			node('window', {
				fn: 'moving_avg',
				valueColumn: 'sales',
				partitionBy: [],
				orderBy: 'month',
				alias: 'avg7',
				windowSize: 7
			}),
			input
		);
		expect(sql).toContain('rows between 6 preceding and current row');
	});

	it('compiles dedupe with and without key columns', () => {
		expect(compileTransform(node('dedupe', { columns: [] }), input)).toBe(
			'select distinct * from src'
		);
		expect(compileTransform(node('dedupe', { columns: ['id'] }), input)).toContain(
			'qualify row_number() over (partition by "id") = 1'
		);
	});

	it('compiles sampling', () => {
		expect(compileTransform(node('sample', { mode: 'rows', value: 100 }), input)).toBe(
			'select * from src using sample 100 rows'
		);
		expect(compileTransform(node('sample', { mode: 'percent', value: 10 }), input)).toBe(
			'select * from src using sample 10 percent'
		);
	});

	it('compiles casts and renames', () => {
		expect(compileTransform(node('cast', { column: 'amount', type: 'double' }), input)).toBe(
			'select * replace (cast("amount" as double) as "amount") from src'
		);
		expect(
			compileTransform(node('rename', { renames: [{ from: 'a', to: 'b' }] }), input)
		).toBe('select * rename ("a" as "b") from src');
	});

	it('compiles pivot and unpivot', () => {
		expect(
			compileTransform(
				node('pivot', { on: 'month', valueColumn: 'sales', fn: 'sum', groupBy: ['region'] }),
				input
			)
		).toBe('select * from (pivot src on "month" using sum("sales") group by "region")');
		expect(
			compileTransform(
				node('unpivot', { columns: ['jan', 'feb'], nameAlias: 'month', valueAlias: 'sales' }),
				input
			)
		).toBe('select * from (unpivot src on "jan", "feb" into name "month" value "sales")');
	});

	it('interpolates params in filter values and formulas', () => {
		const sql = compileTransform(
			node('filter', {
				combinator: 'and',
				conditions: [{ column: 'region', op: 'eq', value: '{{region}}' }]
			}),
			input,
			[{ name: 'region', value: 'EMEA' }]
		);
		expect(sql).toBe(`select * from src where "region" = 'EMEA'`);
		const formula = compileTransform(
			node('formula', { alias: 'taxed', expression: 'amount * {{rate}}' }),
			input,
			[{ name: 'rate', value: '1.2' }]
		);
		expect(formula).toContain('amount * 1.2');
	});
});

describe('interpolateParams', () => {
	it('replaces placeholders and leaves unknown ones', () => {
		const params = [{ name: 'year', value: '2024' }];
		expect(interpolateParams('y = {{year}} and {{ year }} but {{other}}', params)).toBe(
			'y = 2024 and 2024 but {{other}}'
		);
		expect(interpolateParams('nothing', undefined)).toBe('nothing');
	});
});

describe('wouldCycle', () => {
	it('detects that closing a loop is invalid', () => {
		const wf = workflow(
			['a', 'b', 'c'],
			[
				['a', 'b'],
				['b', 'c']
			]
		);
		expect(wouldCycle(wf, 'c', 'a')).toBe(true);
		expect(wouldCycle(wf, 'a', 'c')).toBe(false);
		expect(wouldCycle(wf, 'a', 'a')).toBe(true);
	});
});
