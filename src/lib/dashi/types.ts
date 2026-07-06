import type { Widget } from '$lib/widgets/types';
import type { DataConnection } from '$lib/connections/types';

export const DASHI_VERSION = 1;
export const DASHI_EXTENSION = '.dashi';

/**
 * The `.dashi` file format: a single JSON document describing a dashboard.
 * File connections only carry metadata — their blobs must be re-attached
 * via the Connections window after opening on a new machine.
 */
export interface DashboardBackground {
	/** Draw the snap-to-grid lines behind widgets. */
	showGrid: boolean;
	/** Custom background color; empty/undefined falls back to the app theme. */
	color?: string;
}

export const defaultBackground: DashboardBackground = { showGrid: false };

export interface DashiFile {
	version: number;
	name: string;
	colorScheme: string;
	background: DashboardBackground;
	widgets: Widget[];
	connections: DataConnection[];
}

export function serializeDashi(doc: DashiFile): string {
	return JSON.stringify(doc, null, 2);
}

export function parseDashi(raw: string): DashiFile {
	let data: unknown;
	try {
		data = JSON.parse(raw);
	} catch {
		throw new Error('Not a valid .dashi file: invalid JSON.');
	}
	if (typeof data !== 'object' || data === null) {
		throw new Error('Not a valid .dashi file: expected a JSON object.');
	}
	const doc = data as Partial<DashiFile>;
	if (typeof doc.version !== 'number' || doc.version > DASHI_VERSION) {
		throw new Error('Unsupported .dashi version.');
	}
	if (typeof doc.name !== 'string' || !Array.isArray(doc.widgets)) {
		throw new Error('Not a valid .dashi file: missing name or widgets.');
	}
	const background = (doc.background ?? {}) as Partial<DashboardBackground>;
	return {
		version: DASHI_VERSION,
		name: doc.name,
		colorScheme: typeof doc.colorScheme === 'string' ? doc.colorScheme : 'blue',
		background: {
			showGrid: background.showGrid === true,
			color: typeof background.color === 'string' ? background.color : undefined
		},
		widgets: doc.widgets,
		connections: Array.isArray(doc.connections) ? doc.connections : []
	};
}
