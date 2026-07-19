import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerConnection } from '$lib/server/connectionsStore';
import { queryMysql, queryPostgres, querySqlite } from '$lib/server/duckdbProxy';

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json()) as { connectionId: string; sql: string };
	const connection = await getServerConnection(body.connectionId);

	if (!connection) {
		return json({ error: 'connection not found' }, { status: 404 });
	}

	try {
		const result =
			connection.kind === 'postgres'
				? await queryPostgres(connection, body.sql)
				: connection.kind === 'mysql'
					? await queryMysql(connection, body.sql)
					: await querySqlite(connection, body.sql);
		return json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'query failed';
		return json({ error: message }, { status: 400 });
	}
};
