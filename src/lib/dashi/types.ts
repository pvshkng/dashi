import type { Widget } from '$lib/widgets/types';
import type { DataConnection } from '$lib/connections/types';

export const DASHI_VERSION = 1;
export const DASHI_EXTENSION = '.dashi';

/**
 * The `.dashi` file format: a single JSON document describing a dashboard.
 * File connections only carry metadata — their blobs must be re-attached
 * via the Connections window after opening on a new machine.
 */
export interface DashiFile {
	version: number;
	name: string;
	colorScheme: string;
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
	return {
		version: DASHI_VERSION,
		name: doc.name,
		colorScheme: typeof doc.colorScheme === 'string' ? doc.colorScheme : 'blue',
		widgets: doc.widgets,
		connections: Array.isArray(doc.connections) ? doc.connections : []
	};
}
