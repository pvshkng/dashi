import { get, set, del, keys } from 'idb-keyval';
import type { DataConnection, FileConnection, ServerConnection, UrlConnection } from './types';
import { isFileConnection } from './types';
import { registerFileBlob, registerUrlConnection } from '$lib/duckdb/registerSource';

const METADATA_PREFIX = 'connection:';
const BLOB_PREFIX = 'connection-blob:';

function metadataKey(id: string): string {
	return `${METADATA_PREFIX}${id}`;
}

function blobKey(id: string): string {
	return `${BLOB_PREFIX}${id}`;
}

class ConnectionsStore {
	connections = $state<DataConnection[]>([]);
	loaded = $state(false);

	async load(): Promise<void> {
		const allKeys = await keys();
		const connectionKeys = allKeys.filter(
			(key): key is string => typeof key === 'string' && key.startsWith(METADATA_PREFIX)
		);
		const loaded: DataConnection[] = [];
		for (const key of connectionKeys) {
			const connection = await get<DataConnection>(key);
			if (connection) {
				loaded.push(connection);
			}
		}
		loaded.sort((a, b) => a.createdAt - b.createdAt);
		this.connections = loaded;
		this.loaded = true;
	}

	async addFileConnection(connection: FileConnection, blob: Blob): Promise<void> {
		await set(blobKey(connection.id), blob);
		await set(metadataKey(connection.id), connection);
		await registerFileBlob(connection, blob);
		this.connections = [...this.connections, connection];
	}

	async addUrlConnection(connection: UrlConnection): Promise<void> {
		await registerUrlConnection(connection);
		await set(metadataKey(connection.id), connection);
		this.connections = [...this.connections, connection];
	}

	async addMetadataOnly(connection: DataConnection): Promise<void> {
		await set(metadataKey(connection.id), connection);
		if (!this.connections.some((existing) => existing.id === connection.id)) {
			this.connections = [...this.connections, connection];
		}
	}

	async addServerConnection(connection: ServerConnection): Promise<void> {
		await set(metadataKey(connection.id), connection);
		this.connections = [...this.connections, connection];
	}

	async remove(id: string): Promise<void> {
		await del(metadataKey(id));
		await del(blobKey(id));
		this.connections = this.connections.filter((connection) => connection.id !== id);
	}

	async reregisterFileConnections(): Promise<void> {
		for (const connection of this.connections) {
			if (isFileConnection(connection)) {
				const blob = await get<Blob>(blobKey(connection.id));
				if (blob) {
					await registerFileBlob(connection, blob);
				}
			} else if (connection.kind === 'url') {
				try {
					await registerUrlConnection(connection);
				} catch {
					// Remote file may be unreachable; queries against it will surface the error.
				}
			}
		}
	}
}

export const connectionsStore = new ConnectionsStore();
