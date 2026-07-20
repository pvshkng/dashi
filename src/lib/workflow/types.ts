export type SourceNodeKind = 'table' | 'sql';
export type TransformNodeKind =
	| 'filter'
	| 'select'
	| 'formula'
	| 'aggregate'
	| 'join'
	| 'union'
	| 'sort'
	| 'limit'
	| 'pivot'
	| 'unpivot'
	| 'window'
	| 'dedupe'
	| 'sample'
	| 'cast'
	| 'rename';
export type VizNodeKind = 'chart' | 'grid' | 'metric' | 'pivottable';
export type NodeKind = SourceNodeKind | TransformNodeKind | VizNodeKind;

export type FilterOp =
	'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'is_null' | 'not_null';

export interface FilterCondition {
	column: string;
	op: FilterOp;
	value: string;
}

export type AggregateFn =
	| 'count'
	| 'count_distinct'
	| 'sum'
	| 'avg'
	| 'min'
	| 'max'
	| 'median'
	| 'stddev';

export interface AggregateSpec {
	fn: AggregateFn;
	column: string;
	alias: string;
}

export interface SortKey {
	column: string;
	dir: 'asc' | 'desc';
}

export type ChartType =
	| 'line'
	| 'bar'
	| 'horizontal-bar'
	| 'stacked-bar'
	| 'grouped-bar'
	| 'area'
	| 'scatter'
	| 'pie'
	| 'donut'
	| 'histogram'
	| 'heatmap'
	| 'funnel'
	| 'waterfall'
	| 'gauge'
	| 'treemap';

export interface ValueFormat {
	style: 'number' | 'currency' | 'percent' | 'compact';
	currency?: string;
	decimals?: number;
}

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

export interface PivotNodeConfig {
	on: string;
	valueColumn: string;
	fn: AggregateFn;
	groupBy: string[];
}

export interface UnpivotNodeConfig {
	columns: string[];
	nameAlias: string;
	valueAlias: string;
}

export type WindowFn =
	| 'row_number'
	| 'rank'
	| 'lag'
	| 'lead'
	| 'cumulative_sum'
	| 'moving_avg'
	| 'pct_change';

export interface WindowNodeConfig {
	fn: WindowFn;
	valueColumn: string;
	partitionBy: string[];
	orderBy: string;
	alias: string;
	windowSize: number;
}

export interface DedupeNodeConfig {
	columns: string[];
}

export interface SampleNodeConfig {
	mode: 'rows' | 'percent';
	value: number;
}

export type CastType = 'varchar' | 'integer' | 'double' | 'date' | 'timestamp' | 'boolean';

export interface CastNodeConfig {
	column: string;
	type: CastType;
}

export interface RenameNodeConfig {
	renames: { from: string; to: string }[];
}

export interface ChartNodeConfig {
	chartType: ChartType;
	x: string;
	y: string;
	series?: string;
	colorScheme: string;
	format?: ValueFormat;
	/** Number of buckets for histograms. */
	bins?: number;
	/** Gauge scale maximum. */
	max?: number;
	/** Ordered dimensions for click-to-drill; requires them on the node's input. */
	drillDimensions?: string[];
}

export interface GridNodeConfig {
	pageSize: number;
	format?: ValueFormat;
}

export interface MetricAlert {
	op: 'gt' | 'lt';
	threshold: number;
}

export interface MetricNodeConfig {
	column: string;
	label: string;
	prefix?: string;
	suffix?: string;
	format?: ValueFormat;
	alert?: MetricAlert;
}

export interface PivotTableNodeConfig {
	rows: string[];
	cols: string[];
	valueColumn: string;
	fn: AggregateFn;
	showTotals: boolean;
	format?: ValueFormat;
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
	pivot: PivotNodeConfig;
	unpivot: UnpivotNodeConfig;
	window: WindowNodeConfig;
	dedupe: DedupeNodeConfig;
	sample: SampleNodeConfig;
	cast: CastNodeConfig;
	rename: RenameNodeConfig;
	chart: ChartNodeConfig;
	grid: GridNodeConfig;
	metric: MetricNodeConfig;
	pivottable: PivotTableNodeConfig;
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

export interface WorkflowParam {
	name: string;
	value: string;
}

export interface Workflow {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	/** Values substituted for {{name}} in SQL, formulas and filter values. */
	params?: WorkflowParam[];
}

export function createWorkflow(name: string): Workflow {
	const now = Date.now();
	return { id: crypto.randomUUID(), name, createdAt: now, updatedAt: now, nodes: [], edges: [] };
}
