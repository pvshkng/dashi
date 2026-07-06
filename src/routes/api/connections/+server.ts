import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { PostgresConnection, SqliteConnection } from '$lib/connections/types';
import {
	deleteServerConnection,
	listServerConnections,
	saveServerConnection
} from '$lib/server/connectionsStore';

function toPublic(connection: PostgresConnection | SqliteConnection) {
	if (connection.kind === 'postgres') {
		return {
			id: connection.id,
			name: connection.name,
			createdAt: connection.createdAt,
			kind: connection.kind,
			host: connection.host,
			port: connection.port,
			database: connection.database,
			user: connection.user
		};
	}
	return connection;
}

export const GET: RequestHandler = async () => {
	const connections = await listServerConnections();
	return json(connections.map(toPublic));
};

export const POST: RequestHandler = async ({ request }) => {
	const connection = (await request.json()) as PostgresConnection | SqliteConnection;
	await saveServerConnection(connection);
	return json(toPublic(connection));
};

export const DELETE: RequestHandler = async ({ url }) => {
	const id = url.searchParams.get('id');
	if (!id) {
		return json({ error: 'missing id' }, { status: 400 });
	}
	await deleteServerConnection(id);
	return json({ ok: true });
};
