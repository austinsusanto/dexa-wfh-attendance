import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppConfig } from './config.types';

/**
 * Builds TypeORM connection options from validated config.
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
		autoLoadEntities: true,
		synchronize: false,
		migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
		timezone: 'Z',
	};
}