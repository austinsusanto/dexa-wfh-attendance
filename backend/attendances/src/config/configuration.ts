import { plainToInstance } from 'class-transformer';
import {
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	validateSync,
} from 'class-validator';
import { AppConfig } from './config.types';
import { NodeEnv } from './config.enum';

/**
 * Validation schema for raw environment variables. Throws on missing/invalid
 * env so the service fails fast at boot instead of at first DB/storage use.
 */
class EnvironmentVariables {
	@IsOptional()
	@IsEnum(NodeEnv)
	NODE_ENV?: NodeEnv;

	@IsOptional()
	@IsString()
	TCP_HOST?: string;

	@IsOptional()
	@IsString()
	TCP_PORT?: string;

	@IsNotEmpty()
	@IsString()
	DB_HOST: string;

	@IsNotEmpty()
	@IsString()
	DB_PORT: string;

	@IsNotEmpty()
	@IsString()
	DB_USERNAME: string;

	@IsNotEmpty()
	@IsString()
	DB_PASSWORD: string;

	@IsNotEmpty()
	@IsString()
	DB_DATABASE: string;

	@IsNotEmpty()
	@IsString()
	MINIO_ENDPOINT: string;

	@IsNotEmpty()
	@IsString()
	MINIO_PORT: string;

	@IsNotEmpty()
	@IsString()
	MINIO_ACCESS_KEY: string;

	@IsNotEmpty()
	@IsString()
	MINIO_SECRET_KEY: string;

	@IsOptional()
	@IsString()
	MINIO_USE_SSL?: string;

	@IsOptional()
	@IsString()
	MINIO_BUCKET?: string;

	@IsOptional()
	@IsString()
	EMPLOYEES_TCP_HOST?: string;

	@IsOptional()
	@IsString()
	EMPLOYEES_TCP_PORT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
	const validated = plainToInstance(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});

	const errors = validateSync(validated, { skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(
			`Invalid environment configuration:\n${errors
				.map((error) =>
					Object.values(error.constraints ?? {}).join(', '),
				)
				.join('\n')}`,
		);
	}

	return validated;
}

/** Loads and normalizes configuration from environment variables. */
export default (): AppConfig => ({
	nodeEnv: process.env.NODE_ENV ?? 'development',
	tcp: {
		host: process.env.TCP_HOST ?? '0.0.0.0',
		port: parseInt(process.env.TCP_PORT ?? '4003', 10),
	},
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: parseInt(process.env.DB_PORT ?? '3306', 10),
		username: process.env.DB_USERNAME ?? 'dexa',
		password: process.env.DB_PASSWORD ?? 'dexa_password',
		database: process.env.DB_DATABASE ?? 'attendances_db',
	},
	minio: {
		endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
		port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
		useSSL: process.env.MINIO_USE_SSL === 'true',
		accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
		secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
		bucket: process.env.MINIO_BUCKET ?? 'attendance-photos',
	},
	employeesClient: {
		host: process.env.EMPLOYEES_TCP_HOST ?? 'localhost',
		port: parseInt(process.env.EMPLOYEES_TCP_PORT ?? '4002', 10),
	},
});
