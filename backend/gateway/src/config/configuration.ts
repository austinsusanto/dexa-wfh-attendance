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
 * env so the gateway fails fast at boot instead of at first JWT/storage use.
 */
class EnvironmentVariables {
	@IsOptional()
	@IsEnum(NodeEnv)
	NODE_ENV?: NodeEnv;

	@IsOptional()
	@IsString()
	PORT?: string;

	@IsOptional()
	@IsString()
	CORS_ORIGIN?: string;

	@IsNotEmpty()
	@IsString()
	JWT_SECRET: string;

	@IsOptional()
	@IsString()
	IDENTITY_TCP_HOST?: string;

	@IsOptional()
	@IsString()
	IDENTITY_TCP_PORT?: string;

	@IsOptional()
	@IsString()
	EMPLOYEES_TCP_HOST?: string;

	@IsOptional()
	@IsString()
	EMPLOYEES_TCP_PORT?: string;

	@IsOptional()
	@IsString()
	ATTENDANCES_TCP_HOST?: string;

	@IsOptional()
	@IsString()
	ATTENDANCES_TCP_PORT?: string;

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
	port: parseInt(process.env.PORT ?? '3000', 10),
	corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),
	jwt: {
		secret: process.env.JWT_SECRET ?? 'change_me_in_production',
	},
	identityClient: {
		host: process.env.IDENTITY_TCP_HOST ?? 'localhost',
		port: parseInt(process.env.IDENTITY_TCP_PORT ?? '4001', 10),
	},
	employeesClient: {
		host: process.env.EMPLOYEES_TCP_HOST ?? 'localhost',
		port: parseInt(process.env.EMPLOYEES_TCP_PORT ?? '4002', 10),
	},
	attendancesClient: {
		host: process.env.ATTENDANCES_TCP_HOST ?? 'localhost',
		port: parseInt(process.env.ATTENDANCES_TCP_PORT ?? '4003', 10),
	},
	minio: {
		endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
		port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
		useSSL: process.env.MINIO_USE_SSL === 'true',
		accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
		secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
		bucket: process.env.MINIO_BUCKET ?? 'attendance-photos',
	},
});
