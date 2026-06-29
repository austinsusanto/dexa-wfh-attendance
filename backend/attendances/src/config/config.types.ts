/**
 * Type definitions for the Attendances service configuration.
 */

export interface DatabaseConfig {
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
}

export interface TcpConfig {
	host: string;
	port: number;
}

export interface MinioConfig {
	endPoint: string;
	port: number;
	useSSL: boolean;
	accessKey: string;
	secretKey: string;
	bucket: string;
}

export interface AppConfig {
	nodeEnv: string;
	tcp: TcpConfig;
	database: DatabaseConfig;
	minio: MinioConfig;
	/** Where to reach the Employees service (monitoring enrichment). */
	employeesClient: TcpConfig;
}
