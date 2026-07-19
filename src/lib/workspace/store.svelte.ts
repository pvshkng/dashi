import { get, set } from 'idb-keyval';
import type { Widget } from '$lib/widgets/types';
import type { Workflow } from '$lib/workflow/types';
import { connectionsStore } from '$lib/connections/store.svelte';

const KEYS = {
	workflows: 'workspace:workflows',
	widgets: 'workspace:widgets',
	settings: 'workspace:settings'
} as const;

type SyncKey = keyof typeof KEYS;

export interface DashboardSettings {
	name: string;
	colorScheme: string;
	showGrid: boolean;
	backgroundColor?: string;
}

const defaultSettings: DashboardSettings = {
	name: 'My dashboard',
	colorScheme: 'blue',
	showGrid: false
};

export interface WorkspaceExport {
	version: 2;
	settings: DashboardSettings;
	widgets: Widget[];
	workflows: Workflow[];
	connections: unknown[];
}

/**
 * The whole app state: workflows, dashboard widgets, dashboard settings.
 * Persisted to IndexedDB and mirrored across browser windows over a
 * BroadcastChannel so a workflow edit in one window updates dashboards in
 * every other window (split screen).
 */
class WorkspaceStore {
	workflows = $state<Workflow[]>([]);
	widgets = $state<Widget[]>([]);
	settings = $state<DashboardSettings>({ ...defaultSettings });
	loaded = $state(false);

	private channel: BroadcastChannel | null = null;

	async init(): Promise<void> {
		if (this.loaded) return;
		const [workflows, widgets, settings] = await Promise.all([
			get<Workflow[]>(KEYS.workflows),
			get<Widget[]>(KEYS.widgets),
			get<DashboardSettings>(KEYS.settings)
		]);
		this.workflows = workflows ?? [];
		this.widgets = widgets ?? [];
		this.settings = { ...defaultSettings, ...settings };
		if (!this.channel && typeof BroadcastChannel !== 'undefined') {
			this.channel = new BroadcastChannel('dashi-workspace');
			this.channel.onmessage = (event: MessageEvent<{ key: SyncKey }>) => {
				this.pull(event.data.key);
			};
		}
		this.loaded = true;
	}

	private async pull(key: SyncKey): Promise<void> {
		if (key === 'workflows') this.workflows = (await get<Workflow[]>(KEYS.workflows)) ?? [];
		else if (key === 'widgets') this.widgets = (await get<Widget[]>(KEYS.widgets)) ?? [];
		else this.settings = { ...defaultSettings, ...(await get<DashboardSettings>(KEYS.settings)) };
	}

	private async push(key: SyncKey): Promise<void> {
		const value =
			key === 'workflows'
				? $state.snapshot(this.workflows)
				: key === 'widgets'
					? $state.snapshot(this.widgets)
					: $state.snapshot(this.settings);
		await set(KEYS[key], value);
		this.channel?.postMessage({ key });
	}

	workflowById(id: string): Workflow | undefined {
		return this.workflows.find((workflow) => workflow.id === id);
	}

	addWorkflow(workflow: Workflow): void {
		this.workflows = [...this.workflows, workflow];
		this.push('workflows');
	}

	updateWorkflow(workflow: Workflow, options: { touch?: boolean } = {}): void {
		const index = this.workflows.findIndex((existing) => existing.id === workflow.id);
		if (index === -1) return;
		if (options.touch !== false) workflow.updatedAt = Date.now();
		this.workflows[index] = workflow;
		this.push('workflows');
	}

	removeWorkflow(id: string): void {
		this.workflows = this.workflows.filter((workflow) => workflow.id !== id);
		this.widgets = this.widgets.filter(
			(widget) => widget.kind !== 'viz' || widget.config.workflowId !== id
		);
		this.push('workflows');
		this.push('widgets');
	}

	duplicateWorkflow(id: string): Workflow | undefined {
		const source = this.workflowById(id);
		if (!source) return undefined;
		const copy = structuredClone($state.snapshot(source)) as Workflow;
		copy.id = crypto.randomUUID();
		copy.name = `${copy.name} copy`;
		copy.createdAt = Date.now();
		copy.updatedAt = Date.now();
		this.addWorkflow(copy);
		return copy;
	}

	addWidget(widget: Widget): void {
		this.widgets = [...this.widgets, widget];
		this.push('widgets');
	}

	updateWidget(widget: Widget): void {
		const index = this.widgets.findIndex((existing) => existing.id === widget.id);
		if (index === -1) return;
		this.widgets[index] = widget;
		this.push('widgets');
	}

	removeWidget(id: string): void {
		this.widgets = this.widgets.filter((widget) => widget.id !== id);
		this.push('widgets');
	}

	updateSettings(partial: Partial<DashboardSettings>): void {
		this.settings = { ...this.settings, ...partial };
		this.push('settings');
	}

	exportFile(): void {
		const doc: WorkspaceExport = {
			version: 2,
			settings: $state.snapshot(this.settings),
			widgets: $state.snapshot(this.widgets),
			workflows: $state.snapshot(this.workflows),
			connections: connectionsStore.connections.map((c) => $state.snapshot(c))
		};
		const name = this.settings.name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-') || 'workspace';
		const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = `${name}.dashi`;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	async importFile(file: File): Promise<void> {
		const doc = JSON.parse(await file.text()) as Partial<WorkspaceExport>;
		if (doc.version !== 2 || !Array.isArray(doc.widgets) || !Array.isArray(doc.workflows)) {
			throw new Error('Not a valid .dashi v2 file.');
		}
		this.settings = { ...defaultSettings, ...doc.settings };
		this.widgets = doc.widgets;
		this.workflows = doc.workflows;
		for (const connection of (doc.connections ?? []) as never[]) {
			await connectionsStore.addMetadataOnly(connection);
		}
		await Promise.all([this.push('settings'), this.push('widgets'), this.push('workflows')]);
	}
}

export const workspaceStore = new WorkspaceStore();
