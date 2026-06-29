/**
 * Type definitions for the Identity service configuration.
 */

export interface DatabaseConfig {
	host: string;
	port: number;
	username: string;
	password: string;
	database: string;
}

export interface JwtConfig {
	secret: string;
	expiresIn: string;
}

export interface TcpConfig {
	host: string;
	port: number;
}

export interface AppConfig {
	nodeEnv: string;
	tcp: TcpConfig;
	database: DatabaseConfig;
	jwt: JwtConfig;
	/** Where to reach the Employees service (for the deactivation check). */
	employeesClient: TcpConfig;
}
