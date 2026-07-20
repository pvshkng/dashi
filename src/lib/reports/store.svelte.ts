import { get, set } from 'idb-keyval';
import type { ChartType } from '$lib/workflow/types';

const KEY = 'workspace:reports';

export interface ReportCellChart {
	show: 'table' | 'chart' | 'both';
	chartType: ChartType;
	x: string;
	y: string;
	colorScheme: string;
}

export interface ReportCell {
	id: string;
	kind: 'markdown' | 'query';
	text: string;
	chart?: ReportCellChart;
}

export interface Report {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	cells: ReportCell[];
}

export function createReport(name: string): Report {
	const now = Date.now();
	return {
		id: crypto.randomUUID(),
		name,
		createdAt: now,
		updatedAt: now,
		cells: [
			{ id: crypto.randomUUID(), kind: 'markdown', text: `# ${name}\n\nWrite an intro here.` },
			{ id: crypto.randomUUID(), kind: 'query', text: 'show tables' }
		]
	};
}

class ReportsStore {
	reports = $state<Report[]>([]);
	loaded = $state(false);

	async load(): Promise<void> {
		if (this.loaded) return;
		this.reports = (await get<Report[]>(KEY)) ?? [];
		this.loaded = true;
	}

	private async persist(): Promise<void> {
		await set(KEY, $state.snapshot(this.reports));
	}

	add(report: Report): void {
		this.reports = [...this.reports, report];
		void this.persist();
	}

	update(report: Report): void {
		const index = this.reports.findIndex((existing) => existing.id === report.id);
		if (index === -1) return;
		report.updatedAt = Date.now();
		this.reports[index] = report;
		void this.persist();
	}

	remove(id: string): void {
		this.reports = this.reports.filter((report) => report.id !== id);
		void this.persist();
	}
}

export const reportsStore = new ReportsStore();
