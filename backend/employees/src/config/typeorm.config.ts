import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.types';

/**
 * Builds TypeORM options for the Employees service. Owns only the `employees`
 * table in its own schema (employees_db); no cross-service FKs.
 */
export function buildTypeOrmOptions(
	configService: ConfigService<AppConfig, true>,
): TypeOrmModuleOptions {
	const db = configService.get('database', { infer: true });

	return {
		type: 'mysql',
		host: db.host,
		port: db.port,
		username: db.username,
		password: db.password,
		database: db.database,
		entities: [__dirname + '/../**/*.entity{.ts,.js}'],
		synchronize: false,
		migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
		timezone: 'Z',
	};
}
