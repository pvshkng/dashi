export type FileConnectionKind = 'csv' | 'excel' | 'parquet' | 'json';
export type ServerConnectionKind = 'postgres' | 'mysql' | 'sqlite' | 'duckdb';
export type ConnectionKind = FileConnectionKind | ServerConnectionKind | 'url';

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

export interface JsonConnection extends FileConnectionBase {
	kind: 'json';
}

export type UrlFormat = 'csv' | 'parquet' | 'json';

/** Remote file read straight by DuckDB over https (or s3 with public access). */
export interface UrlConnection {
	id: string;
	name: string;
	createdAt: number;
	kind: 'url';
	url: string;
	format: UrlFormat;
	tableName: string;
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

/** A DuckDB database file readable by the server (attach). */
export interface DuckDbConnection {
	id: string;
	name: string;
	createdAt: number;
	kind: 'duckdb';
	filePath: string;
}

export type FileConnection = CsvConnection | ExcelConnection | ParquetConnection | JsonConnection;
export type ServerConnection =
	PostgresConnection | MySqlConnection | SqliteConnection | DuckDbConnection;

export type DataConnection = FileConnection | UrlConnection | ServerConnection;

export function isFileConnection(connection: DataConnection): connection is FileConnection {
	return (
		connection.kind === 'csv' ||
		connection.kind === 'excel' ||
		connection.kind === 'parquet' ||
		connection.kind === 'json'
	);
}

/** Connections whose data lives in the in-browser DuckDB instance. */
export function isLocalConnection(
	connection: DataConnection
): connection is FileConnection | UrlConnection {
	return isFileConnection(connection) || connection.kind === 'url';
}

export function isServerConnection(connection: DataConnection): connection is ServerConnection {
	return (
		connection.kind === 'postgres' ||
		connection.kind === 'mysql' ||
		connection.kind === 'sqlite' ||
		connection.kind === 'duckdb'
	);
}
