/**
 * Type definitions for the Employees service configuration.
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

export interface AppConfig {
	nodeEnv: string;
	tcp: TcpConfig;
	database: DatabaseConfig;
	/** Where to reach the Identity service (to provision the login account). */
	identityClient: TcpConfig;
}
