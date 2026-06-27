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
 * Validation schema for raw environment variables.
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
	JWT_SECRET: string;

	@IsOptional()
	@IsString()
	JWT_EXPIRES_IN?: string;

	@IsOptional()
	@IsString()
	UPLOAD_DIR?: string;
}

/**
 * Throws on missing/invalid env so the app
 * fails fast at boot instead of at first DB/JWT use.
 */
export function validateEnv(config: Record<string, unknown>) {
	const validated = plainToInstance(EnvironmentVariables, config, {
		enableImplicitConversion: true,
	});

	const errors = validateSync(validated, { skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(
			`Invalid environment configuration:\n${errors
				.map((error) => Object.values(error.constraints ?? {}).join(', '))
				.join('\n')}`,
		);
	}

	return validated;
}

/**
 * Loads and normalizes configuration from environment variables.
 */
export default (): AppConfig => ({
	nodeEnv: process.env.NODE_ENV ?? 'development',
	port: parseInt(process.env.PORT ?? '3000', 10),
	corsOrigin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean),
	database: {
		host: process.env.DB_HOST ?? 'localhost',
		port: parseInt(process.env.DB_PORT ?? '3306', 10),
		username: process.env.DB_USERNAME ?? 'dexa',
		password: process.env.DB_PASSWORD ?? 'dexa_password',
		database: process.env.DB_DATABASE ?? 'dexa_wfh',
	},
	jwt: {
		secret: process.env.JWT_SECRET ?? 'change_me_in_production',
		expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
	},
	uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
});