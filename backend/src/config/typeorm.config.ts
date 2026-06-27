import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.types';

/**
 * Builds TypeORM connection options from validated config.
 *
 * Entities are loaded by glob (not autoLoadEntities) so all entity metadata is
 * present regardless of which feature modules are registered — our entities
 * reference each other (User <-> Employee <-> Attendance). `synchronize` is
 * always false; schema changes go through migrations (Tahap 2).
 *
 * NOTE (microservices end goal): this is a monolith-phase detail. On extraction
 * each service will own its DB connection/config and load only its own entities;
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