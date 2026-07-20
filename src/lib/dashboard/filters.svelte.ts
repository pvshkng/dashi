export type DashFilterOp = 'eq' | 'in' | 'contains' | 'between';

export interface ActiveFilter {
	id: string;
	column: string;
	op: DashFilterOp;
	value: string;
	value2?: string;
	values?: string[];
	/** Widget that produced the filter; that widget is not filtered by it. */
	sourceWidgetId?: string;
}

function literal(value: string): string {
	if (/^-?\d+(\.\d+)?$/.test(value.trim())) return value.trim();
	return `'${value.replaceAll("'", "''")}'`;
}

function quoteIdent(identifier: string): string {
	return `"${identifier.replaceAll('"', '""')}"`;
}

export function filterClause(filter: ActiveFilter): string {
	const col = quoteIdent(filter.column);
	switch (filter.op) {
		case 'eq':
			return `${col}::varchar = ${literal(filter.value)}::varchar`;
		case 'in':
			return `${col}::varchar in (${(filter.values ?? []).map((v) => literal(v)).join(', ') || "''"})`;
		case 'contains':
			return `${col}::varchar ilike '%${filter.value.replaceAll("'", "''")}%'`;
		case 'between': {
			const parts: string[] = [];
			if (filter.value !== '') parts.push(`${col} >= ${literal(filter.value)}`);
			if (filter.value2 !== undefined && filter.value2 !== '')
				parts.push(`${col} <= ${literal(filter.value2)}`);
			return parts.join(' and ') || 'true';
		}
	}
}

export function filterLabel(filter: ActiveFilter): string {
	switch (filter.op) {
		case 'eq':
			return `${filter.column} = ${filter.value}`;
		case 'in':
			return `${filter.column} in (${(filter.values ?? []).join(', ')})`;
		case 'contains':
			return `${filter.column} ~ ${filter.value}`;
		case 'between':
			return `${filter.column}: ${filter.value || '…'} – ${filter.value2 || '…'}`;
	}
}

/**
 * Dashboard-wide selection state. Viz widgets whose result contains a
 * filtered column re-query with the filters applied; the widget that raised
 * a filter is excluded so its own selection stays visible.
 */
class DashboardFilterStore {
	filters = $state<ActiveFilter[]>([]);

	set(filter: ActiveFilter): void {
		const rest = this.filters.filter((existing) => existing.id !== filter.id);
		this.filters = [...rest, filter];
	}

	/** Sets, or removes when the same widget re-selects the same eq value. */
	toggle(filter: ActiveFilter): void {
		const existing = this.filters.find((f) => f.id === filter.id);
		if (existing && existing.op === 'eq' && existing.value === filter.value) {
			this.remove(filter.id);
			return;
		}
		this.set(filter);
	}

	remove(id: string): void {
		this.filters = this.filters.filter((filter) => filter.id !== id);
	}

	clearAll(): void {
		this.filters = [];
	}

	applicable(columns: string[], excludeWidgetId?: string): ActiveFilter[] {
		return this.filters.filter(
			(filter) =>
				columns.includes(filter.column) &&
				(excludeWidgetId === undefined || filter.sourceWidgetId !== excludeWidgetId)
		);
	}

	whereClause(columns: string[], excludeWidgetId?: string): string | null {
		const applicable = this.applicable(columns, excludeWidgetId);
		if (applicable.length === 0) return null;
		return applicable.map(filterClause).join(' and ');
	}
}

export const dashboardFilters = new DashboardFilterStore();
