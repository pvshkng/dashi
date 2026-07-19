export type SourceNodeKind = 'table' | 'sql';
export type TransformNodeKind =
	'filter' | 'select' | 'formula' | 'aggregate' | 'join' | 'union' | 'sort' | 'limit';
export type VizNodeKind = 'chart' | 'grid' | 'metric';
export type NodeKind = SourceNodeKind | TransformNodeKind | VizNodeKind;

export type FilterOp =
	'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'is_null' | 'not_null';

export interface FilterCondition {
	column: string;
	op: FilterOp;
	value: string;
}

export type AggregateFn = 'count' | 'count_distinct' | 'sum' | 'avg' | 'min' | 'max';

export interface AggregateSpec {
	fn: AggregateFn;
	column: string;
	alias: string;
}

export interface SortKey {
	column: string;
	dir: 'asc' | 'desc';
}

export type ChartType = 'line' | 'bar' | 'area' | 'scatter' | 'pie';

export interface TableNodeConfig {
	connectionId: string;
	tableName: string;
}

export interface SqlNodeConfig {
	connectionId: string;
	sql: string;
}

export interface FilterNodeConfig {
	combinator: 'and' | 'or';
	conditions: FilterCondition[];
}

export interface SelectNodeConfig {
	columns: string[];
}

export interface FormulaNodeConfig {
	alias: string;
	expression: string;
}

export interface AggregateNodeConfig {
	groupBy: string[];
	aggregates: AggregateSpec[];
}

export interface JoinNodeConfig {
	joinType: 'inner' | 'left' | 'right' | 'full';
	leftKey: string;
	rightKey: string;
}

export interface UnionNodeConfig {
	all: boolean;
}

export interface SortNodeConfig {
	keys: SortKey[];
}

export interface LimitNodeConfig {
	count: number;
	offset: number;
}

export interface ChartNodeConfig {
	chartType: ChartType;
	x: string;
	y: string;
	series?: string;
	colorScheme: string;
}

export interface GridNodeConfig {
	pageSize: number;
}

export interface MetricNodeConfig {
	column: string;
	label: string;
	prefix?: string;
	suffix?: string;
}

export interface NodeConfigMap {
	table: TableNodeConfig;
	sql: SqlNodeConfig;
	filter: FilterNodeConfig;
	select: SelectNodeConfig;
	formula: FormulaNodeConfig;
	aggregate: AggregateNodeConfig;
	join: JoinNodeConfig;
	union: UnionNodeConfig;
	sort: SortNodeConfig;
	limit: LimitNodeConfig;
	chart: ChartNodeConfig;
	grid: GridNodeConfig;
	metric: MetricNodeConfig;
}

export interface WorkflowNode<K extends NodeKind = NodeKind> {
	id: string;
	kind: K;
	label: string;
	position: { x: number; y: number };
	config: NodeConfigMap[K];
}

export interface WorkflowEdge {
	id: string;
	source: string;
	target: string;
	targetHandle?: string;
}

export interface Workflow {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

export function createWorkflow(name: string): Workflow {
	const now = Date.now();
	return { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now, nodes: [], edges: [] };
}
