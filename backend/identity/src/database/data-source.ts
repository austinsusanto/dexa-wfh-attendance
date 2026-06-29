import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

// Load .env so the TypeORM CLI (migrations) has DB credentials.
loadEnv();

/**
 * Standalone DataSource used by the TypeORM CLI for generating and running
 * Identity service migrations (identity_db).
 */
export const AppDataSource = new DataSource({
	type: 'mysql',
	host: process.env.DB_HOST ?? 'localhost',
	port: parseInt(process.env.DB_PORT ?? '3306', 10),
	username: process.env.DB_USERNAME ?? 'dexa',
	password: process.env.DB_PASSWORD ?? 'dexa_password',
	database: process.env.DB_DATABASE ?? 'identity_db',
	entities: [__dirname + '/../**/*.entity{.ts,.js}'],
	migrations: [__dirname + '/migrations/*{.ts,.js}'],
	synchronize: false,
	timezone: 'Z',
});
