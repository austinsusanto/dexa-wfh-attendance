import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from '../filters/http-exception.filter';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

/**
 * Applies the global app setup shared by production bootstrap (main.ts) and the
 * e2e tests: route prefix, validation, response/error envelope. Keeping this in
 * one place ensures tests behave like production and never drift.
 *
 * Bootstrap-only concerns (Swagger, CORS, listen) stay in main.ts.
 */
export function configureApp(app: INestApplication): void {
	// All routes served under /api/v1.
	app.setGlobalPrefix('api/v1');

	// Validate & sanitize every incoming DTO.
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	// Standard success envelope + error envelope for every response.
	app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
	app.useGlobalFilters(new AllExceptionsFilter());
}
