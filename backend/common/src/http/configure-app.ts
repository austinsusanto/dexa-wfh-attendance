import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AllExceptionsFilter } from './http-exception.filter';
import { ResponseInterceptor } from './response.interceptor';

/**
 * Applies the global HTTP setup shared by the gateway's production bootstrap
 * and its e2e tests: route prefix, validation, response/error envelope. Keeping
 * this in one place ensures tests behave like production and never drift.
 *
 * In the microservices split this runs only on the API Gateway — the backend
 * services speak TCP and have no HTTP layer. Bootstrap-only concerns (Swagger,
 * CORS, listen) stay in the gateway's main.ts.
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
