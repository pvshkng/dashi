import type { NodeKind } from '$lib/workflow/types';
import TableIcon from 'phosphor-svelte/lib/Table';
import CodeIcon from 'phosphor-svelte/lib/Code';
import FunnelIcon from 'phosphor-svelte/lib/Funnel';
import ColumnsIcon from 'phosphor-svelte/lib/Columns';
import FunctionIcon from 'phosphor-svelte/lib/Function';
import SigmaIcon from 'phosphor-svelte/lib/Sigma';
import IntersectIcon from 'phosphor-svelte/lib/Intersect';
import StackIcon from 'phosphor-svelte/lib/Stack';
import SortAscendingIcon from 'phosphor-svelte/lib/SortAscending';
import ScissorsIcon from 'phosphor-svelte/lib/Scissors';
import ChartBarIcon from 'phosphor-svelte/lib/ChartBar';
import GridFourIcon from 'phosphor-svelte/lib/GridFour';
import NumberCircleOneIcon from 'phosphor-svelte/lib/NumberCircleOne';

export const nodeIcons: Record<NodeKind, typeof TableIcon> = {
	table: TableIcon,
	sql: CodeIcon,
	filter: FunnelIcon,
	select: ColumnsIcon,
	formula: FunctionIcon,
	aggregate: SigmaIcon,
	join: IntersectIcon,
	union: StackIcon,
	sort: SortAscendingIcon,
	limit: ScissorsIcon,
	chart: ChartBarIcon,
	grid: GridFourIcon,
	metric: NumberCircleOneIcon
};
