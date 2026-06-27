/**
 * Type definitions for application configuration.
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

export interface AppConfig {
	nodeEnv: string;
	port: number;
	corsOrigin: string[];
	database: DatabaseConfig;
	jwt: JwtConfig;
	uploadDir: string;
}