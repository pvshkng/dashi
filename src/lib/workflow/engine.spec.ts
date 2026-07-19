import { describe, expect, it } from 'vitest';
import { topologicalOrder, wouldCycle } from './engine';
import type { Workflow } from './types';

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
