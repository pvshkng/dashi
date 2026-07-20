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
import ArrowsOutLineHorizontalIcon from 'phosphor-svelte/lib/ArrowsOutLineHorizontal';
import ArrowsInLineVerticalIcon from 'phosphor-svelte/lib/ArrowsInLineVertical';
import WaveSineIcon from 'phosphor-svelte/lib/WaveSine';
import CopySimpleIcon from 'phosphor-svelte/lib/CopySimple';
import ShuffleIcon from 'phosphor-svelte/lib/Shuffle';
import SwapIcon from 'phosphor-svelte/lib/Swap';
import TextboxIcon from 'phosphor-svelte/lib/Textbox';
import SquaresFourIcon from 'phosphor-svelte/lib/SquaresFour';

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
	pivot: ArrowsOutLineHorizontalIcon,
	unpivot: ArrowsInLineVerticalIcon,
	window: WaveSineIcon,
	dedupe: CopySimpleIcon,
	sample: ShuffleIcon,
	cast: SwapIcon,
	rename: TextboxIcon,
	chart: ChartBarIcon,
	grid: GridFourIcon,
	metric: NumberCircleOneIcon,
	pivottable: SquaresFourIcon
};
