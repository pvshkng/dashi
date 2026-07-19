export type FileConnectionKind = 'csv' | 'excel' | 'parquet';
export type ServerConnectionKind = 'postgres' | 'mysql' | 'sqlite';
export type ConnectionKind = FileConnectionKind | ServerConnectionKind;

export interface FileConnectionBase {
	id: string;
	name: string;
	createdAt: number;
	fileName: string;
	tableName: string;
}

export interface CsvConnection extends FileConnectionBase {
	kind: 'csv';
}

export interface ExcelConnection extends FileConnectionBase {
	kind: 'excel';
	sheetName?: string;
}

export interface ParquetConnection extends FileConnectionBase {
	kind: 'parquet';
}

export interface PostgresConnection {
	id: string;
	name: string;
	createdAt: number;
	kind: 'postgres';
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
}

export interface MySqlConnection {
	id: string;
	name: string;
	createdAt: number;
	kind: 'mysql';
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
}

export interface SqliteConnection {
	id: string;
	name: string;
	createdAt: number;
	kind: 'sqlite';
	filePath: string;
}

export type DataConnection =
	| CsvConnection
	| ExcelConnection
	| ParquetConnection
	| PostgresConnection
	| MySqlConnection
	| SqliteConnection;

export function isFileConnection(
	connection: DataConnection
): connection is CsvConnection | ExcelConnection | ParquetConnection {
	return connection.kind === 'csv' || connection.kind === 'excel' || connection.kind === 'parquet';
}

export function isServerConnection(
	connection: DataConnection
): connection is PostgresConnection | MySqlConnection | SqliteConnection {
	return (
		connection.kind === 'postgres' || connection.kind === 'mysql' || connection.kind === 'sqlite'
	);
}
