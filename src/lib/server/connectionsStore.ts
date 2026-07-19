import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { MySqlConnection, PostgresConnection, SqliteConnection } from '$lib/connections/types';

type ServerConnection = PostgresConnection | MySqlConnection | SqliteConnection;

const dataDir = path.join(process.cwd(), '.data');
const storeFile = path.join(dataDir, 'server-connections.json');

async function readStore(): Promise<ServerConnection[]> {
	try {
		const contents = await readFile(storeFile, 'utf-8');
		return JSON.parse(contents) as ServerConnection[];
	} catch {
		return [];
	}
}

async function writeStore(connections: ServerConnection[]): Promise<void> {
	await mkdir(dataDir, { recursive: true });
	await writeFile(storeFile, JSON.stringify(connections, null, 2), 'utf-8');
}

export async function listServerConnections(): Promise<ServerConnection[]> {
	return readStore();
}

export async function saveServerConnection(connection: ServerConnection): Promise<void> {
	const connections = await readStore();
	const withoutExisting = connections.filter((existing) => existing.id !== connection.id);
	withoutExisting.push(connection);
	await writeStore(withoutExisting);
}

export async function deleteServerConnection(id: string): Promise<void> {
	const connections = await readStore();
	await writeStore(connections.filter((connection) => connection.id !== id));
}

export async function getServerConnection(id: string): Promise<ServerConnection | undefined> {
	const connections = await readStore();
	return connections.find((connection) => connection.id === id);
}
