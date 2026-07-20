import type { DataConnection } from '$lib/connections/types';
import { isLocalConnection } from '$lib/connections/types';
import { executeQuery } from '$lib/query/executeQuery';
import { materializeRows, runQuery, runQueryWithColumns } from '$lib/duckdb/client';
import { getNodeDef } from './defs';
import type {
	AggregateNodeConfig,
	FilterCondition,
	FilterNodeConfig,
	FormulaNodeConfig,
	JoinNodeConfig,
	LimitNodeConfig,
	SelectNodeConfig,
	SortNodeConfig,
	SqlNodeConfig,
	TableNodeConfig,
	UnionNodeConfig,
	Workflow,
	WorkflowNode
} from './types';

export interface NodeResult {
	columns: string[];
	rows: Record<string, unknown>[];
	rowCount: number;
	error?: string;
}

export interface WorkflowRun {
	results: Record<string, NodeResult>;
	order: string[];
	error?: string;
}

const SAMPLE_LIMIT = 1000;
const SERVER_FETCH_LIMIT = 10000;

function qi(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

function literal(value: string): string {
	if (/^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
	return `'${value.replaceAll("'", "''")}'`;
}

function hashId(value: string): string {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) {
		hash = ((hash << 5) + hash + value.charCodeAt(i)) >>> 0;
	}
	return hash.toString(16).padStart(8, '0');
}

/** Unique per workflow+node; a truncated prefix collided across workflows sharing ids. */
function viewName(workflowId: string, nodeId: string): string {
	const clean = (s: string) => s.replaceAll(/[^a-zA-Z0-9]/g, '_');
	return `wf_${hashId(workflowId)}_${hashId(nodeId)}_${clean(nodeId).slice(0, 12)}`;
}

export function topologicalOrder(workflow: Workflow): string[] {
	const incoming = new Map<string, number>();
	const outgoing = new Map<string, string[]>();
	for (const node of workflow.nodes) {
		incoming.set(node.id, 0);
		outgoing.set(node.id, []);
	}
	for (const edge of workflow.edges) {
		if (!incoming.has(edge.source) || !incoming.has(edge.target)) continue;
		incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
		outgoing.get(edge.source)?.push(edge.target);
	}
	const queue = [...incoming.entries()].filter(([, n]) => n === 0).map(([id]) => id);
	const order: string[] = [];
	while (queue.length > 0) {
		const id = queue.shift()!;
		order.push(id);
		for (const next of outgoing.get(id) ?? []) {
			const n = (incoming.get(next) ?? 1) - 1;
			incoming.set(next, n);
			if (n === 0) queue.push(next);
		}
	}
	if (order.length !== workflow.nodes.length) {
		throw new Error('Workflow contains a cycle.');
	}
	return order;
}

/** True if adding source→target would create a cycle. */
export function wouldCycle(workflow: Workflow, source: string, target: string): boolean {
	const outgoing = new Map<string, string[]>();
	for (const edge of workflow.edges) {
		if (!outgoing.has(edge.source)) outgoing.set(edge.source, []);
		outgoing.get(edge.source)!.push(edge.target);
	}
	const seen = new Set<string>();
	const stack = [target];
	while (stack.length > 0) {
		const id = stack.pop()!;
		if (id === source) return true;
		if (seen.has(id)) continue;
		seen.add(id);
		stack.push(...(outgoing.get(id) ?? []));
	}
	return false;
}

function inputViews(
	workflow: Workflow,
	node: WorkflowNode,
	views: Map<string, string>
): Record<string, string> {
	const inputs: Record<string, string> = {};
	for (const edge of workflow.edges) {
		if (edge.target !== node.id) continue;
		const view = views.get(edge.source);
		if (view) inputs[edge.targetHandle ?? 'in'] = view;
	}
	return inputs;
}

function filterClause(condition: FilterCondition): string {
	const col = qi(condition.column);
	switch (condition.op) {
		case 'eq':
			return `${col} = ${literal(condition.value)}`;
		case 'neq':
			return `${col} != ${literal(condition.value)}`;
		case 'gt':
			return `${col} > ${literal(condition.value)}`;
		case 'gte':
			return `${col} >= ${literal(condition.value)}`;
		case 'lt':
			return `${col} < ${literal(condition.value)}`;
		case 'lte':
			return `${col} <= ${literal(condition.value)}`;
		case 'contains':
			return `${col}::varchar ilike '%${condition.value.replaceAll("'", "''")}%'`;
		case 'is_null':
			return `${col} is null`;
		case 'not_null':
			return `${col} is not null`;
	}
}

function compileTransform(node: WorkflowNode, inputs: Record<string, string>): string {
	const input = inputs.in;
	switch (node.kind) {
		case 'filter': {
			const config = node.config as FilterNodeConfig;
			const valid = config.conditions.filter((c) => c.column);
			if (valid.length === 0) return `select * from ${input}`;
			const joiner = config.combinator === 'or' ? ' or ' : ' and ';
			return `select * from ${input} where ${valid.map(filterClause).join(joiner)}`;
		}
		case 'select': {
			const config = node.config as SelectNodeConfig;
			if (config.columns.length === 0) return `select * from ${input}`;
			return `select ${config.columns.map(qi).join(', ')} from ${input}`;
		}
		case 'formula': {
			const config = node.config as FormulaNodeConfig;
			if (!config.expression.trim()) return `select * from ${input}`;
			return `select *, (${config.expression}) as ${qi(config.alias || 'computed')} from ${input}`;
		}
		case 'aggregate': {
			const config = node.config as AggregateNodeConfig;
			const groups = config.groupBy.map(qi);
			const aggs = config.aggregates
				.filter((a) => a.column)
				.map((a) => {
					const target = a.column === '*' ? '*' : qi(a.column);
					const expr =
						a.fn === 'count_distinct'
							? `count(distinct ${target})`
							: a.fn === 'count'
								? `count(${target})`
								: `${a.fn}(${target})`;
					return `${expr} as ${qi(a.alias || a.fn)}`;
				});
			if (aggs.length === 0) throw new Error('Aggregate node needs at least one aggregation.');
			const selectList = [...groups, ...aggs].join(', ');
			const groupClause = groups.length > 0 ? ` group by ${groups.join(', ')}` : '';
			return `select ${selectList} from ${input}${groupClause}`;
		}
		case 'join': {
			const config = node.config as JoinNodeConfig;
			const left = inputs.left;
			const right = inputs.right;
			if (!left || !right) throw new Error('Join needs both inputs connected.');
			if (!config.leftKey || !config.rightKey) throw new Error('Join keys are not set.');
			return `select * from ${left} l ${config.joinType} join ${right} r on l.${qi(config.leftKey)} = r.${qi(config.rightKey)}`;
		}
		case 'union': {
			const config = node.config as UnionNodeConfig;
			const a = inputs.a;
			const b = inputs.b;
			if (!a || !b) throw new Error('Union needs both inputs connected.');
			return `select * from ${a} union ${config.all ? 'all ' : ''}select * from ${b}`;
		}
		case 'sort': {
			const config = node.config as SortNodeConfig;
			const keys = config.keys.filter((k) => k.column);
			if (keys.length === 0) return `select * from ${input}`;
			return `select * from ${input} order by ${keys.map((k) => `${qi(k.column)} ${k.dir}`).join(', ')}`;
		}
		case 'limit': {
			const config = node.config as LimitNodeConfig;
			const offset = config.offset > 0 ? ` offset ${config.offset}` : '';
			return `select * from ${input} limit ${config.count}${offset}`;
		}
		default:
			return `select * from ${input}`;
	}
}

async function materializeSource(
	node: WorkflowNode,
	view: string,
	connections: DataConnection[]
): Promise<void> {
	if (node.kind === 'table') {
		const config = node.config as TableNodeConfig;
		if (!config.connectionId || !config.tableName) {
			throw new Error('Pick a connection and table.');
		}
		const connection = connections.find((c) => c.id === config.connectionId);
		if (!connection) throw new Error('Connection not found.');
		if (isLocalConnection(connection)) {
			await runQuery(
				`create or replace temp view ${view} as select * from ${qi(config.tableName)}`
			);
			return;
		}
		const result = await executeQuery(
			connection,
			`select * from ${config.tableName} limit ${SERVER_FETCH_LIMIT}`
		);
		await materializeRows(`${view}_data`, result.columns, result.rows);
		await runQuery(`create or replace temp view ${view} as select * from ${qi(`${view}_data`)}`);
		return;
	}
	const config = node.config as SqlNodeConfig;
	if (!config.sql.trim()) throw new Error('SQL query is empty.');
	const connection = connections.find((c) => c.id === config.connectionId);
	if (connection && !isLocalConnection(connection)) {
		const result = await executeQuery(connection, config.sql);
		await materializeRows(`${view}_data`, result.columns, result.rows);
		await runQuery(`create or replace temp view ${view} as select * from ${qi(`${view}_data`)}`);
		return;
	}
	await runQuery(`create or replace temp view ${view} as ${config.sql}`);
}

export async function runWorkflow(
	workflow: Workflow,
	connections: DataConnection[]
): Promise<WorkflowRun> {
	let order: string[];
	try {
		order = topologicalOrder(workflow);
	} catch (err) {
		return {
			results: {},
			order: [],
			error: err instanceof Error ? err.message : 'Invalid workflow.'
		};
	}

	const results: Record<string, NodeResult> = {};
	const views = new Map<string, string>();
	const nodesById = new Map(workflow.nodes.map((node) => [node.id, node]));

	for (const nodeId of order) {
		const node = nodesById.get(nodeId);
		if (!node) continue;
		const def = getNodeDef(node.kind);
		const view = viewName(workflow.id, node.id);
		const inputs = inputViews(workflow, node, views);

		try {
			if (def.inputs.length > 0 && Object.keys(inputs).length === 0) {
				throw new Error('No input connected.');
			}
			if (def.category === 'source') {
				await materializeSource(node, view, connections);
			} else if (def.category === 'output') {
				const upstream = Object.values(inputs)[0];
				await runQuery(`create or replace temp view ${view} as select * from ${upstream}`);
			} else {
				await runQuery(`create or replace temp view ${view} as ${compileTransform(node, inputs)}`);
			}

			const sample = await runQueryWithColumns(`select * from ${view} limit ${SAMPLE_LIMIT}`);
			const countRows = await runQuery(`select count(*)::int as n from ${view}`);
			const rowCount = Number((countRows[0] as { n?: unknown })?.n ?? sample.rows.length);
			results[node.id] = { columns: sample.columns, rows: sample.rows, rowCount };
			views.set(node.id, view);
		} catch (err) {
			results[node.id] = {
				columns: [],
				rows: [],
				rowCount: 0,
				error: err instanceof Error ? err.message : 'Node failed.'
			};
		}
	}

	return { results, order };
}
