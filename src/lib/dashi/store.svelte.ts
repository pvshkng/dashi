import { get, set, del } from 'idb-keyval';
import type { Widget } from '$lib/widgets/types';
import { DASHI_EXTENSION, parseDashi, serializeDashi, type DashiFile } from './types';
import { connectionsStore } from '$lib/connections/store.svelte';

const CURRENT_DOC_KEY = 'dashi:current';
const CURRENT_FILENAME_KEY = 'dashi:current-filename';

export type AppMode = 'view' | 'edit';

class DashiStore {
	doc = $state<DashiFile | null>(null);
	fileName = $state<string | null>(null);
	mode = $state<AppMode>('view');
	loaded = $state(false);
	error = $state<string | null>(null);

	/** Restore the last open document so a refresh doesn't lose work. */
	async init(): Promise<void> {
		const [saved, savedName] = await Promise.all([
			get<DashiFile>(CURRENT_DOC_KEY),
			get<string>(CURRENT_FILENAME_KEY)
		]);
		if (saved) {
			this.doc = saved;
			this.fileName = savedName ?? null;
			await this.mergeConnections(saved);
			// DuckDB-wasm state doesn't survive a reload; re-seed the example table if used.
			const { mockConnectionId, seedMockData } = await import('$lib/widgets/mock');
			if (saved.connections.some((connection) => connection.id === mockConnectionId)) {
				await seedMockData();
			}
		}
		this.loaded = true;
	}

	private async persist(): Promise<void> {
		if (this.doc) {
			await set(CURRENT_DOC_KEY, $state.snapshot(this.doc));
			await set(CURRENT_FILENAME_KEY, this.fileName ?? '');
		} else {
			await del(CURRENT_DOC_KEY);
			await del(CURRENT_FILENAME_KEY);
		}
	}

	private async mergeConnections(doc: DashiFile): Promise<void> {
		if (!connectionsStore.loaded) await connectionsStore.load();
		for (const connection of doc.connections) {
			if (!connectionsStore.connections.some((existing) => existing.id === connection.id)) {
				await connectionsStore.addMetadataOnly(connection);
			}
		}
	}

	async openFile(file: File): Promise<void> {
		this.error = null;
		try {
			const doc = parseDashi(await file.text());
			this.doc = doc;
			this.fileName = file.name;
			this.mode = 'view';
			await this.mergeConnections(doc);
			await this.persist();
		} catch (err) {
			this.error = err instanceof Error ? err.message : 'Failed to open file.';
		}
	}

	async openExample(): Promise<void> {
		this.error = null;
		const { mockDashboard, mockWidgets, mockCsvConnection, seedMockData } =
			await import('$lib/widgets/mock');
		await seedMockData();
		const doc: DashiFile = {
			version: 1,
			name: mockDashboard.name,
			colorScheme: mockDashboard.colorScheme,
			widgets: structuredClone(mockWidgets),
			connections: [mockCsvConnection]
		};
		this.doc = doc;
		this.fileName = 'example.dashi';
		this.mode = 'view';
		await this.mergeConnections(doc);
		await this.persist();
	}

	newDashboard(name: string): void {
		this.doc = { version: 1, name, colorScheme: 'blue', widgets: [], connections: [] };
		this.fileName = null;
		this.mode = 'edit';
		this.persist();
	}

	/** Download the current document as a .dashi file. */
	saveToFile(): void {
		if (!this.doc) return;
		const doc = $state.snapshot(this.doc);
		doc.connections = connectionsStore.connections.map((c) => $state.snapshot(c));
		const suggested =
			this.fileName ??
			`${doc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'dashboard'}${DASHI_EXTENSION}`;
		const blob = new Blob([serializeDashi(doc)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = suggested;
		anchor.click();
		URL.revokeObjectURL(url);
		this.fileName = suggested;
		this.persist();
	}

	async closeDocument(): Promise<void> {
		this.doc = null;
		this.fileName = null;
		this.mode = 'view';
		await this.persist();
	}

	rename(name: string): void {
		if (!this.doc) return;
		this.doc.name = name;
		this.persist();
	}

	setColorScheme(schemeId: string): void {
		if (!this.doc) return;
		this.doc.colorScheme = schemeId;
		this.persist();
	}

	addWidget(widget: Widget): void {
		if (!this.doc) return;
		this.doc.widgets.push(widget);
		this.persist();
	}

	updateWidget(widget: Widget): void {
		if (!this.doc) return;
		const index = this.doc.widgets.findIndex((existing) => existing.id === widget.id);
		if (index === -1) return;
		this.doc.widgets[index] = widget;
		this.persist();
	}

	removeWidget(widgetId: string): void {
		if (!this.doc) return;
		this.doc.widgets = this.doc.widgets.filter((widget) => widget.id !== widgetId);
		this.persist();
	}
}

export const dashiStore = new DashiStore();
