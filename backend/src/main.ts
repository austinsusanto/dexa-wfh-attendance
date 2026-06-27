import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/config.types';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService<AppConfig, true>);

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

	// Restrict CORS to the configured frontend origin(s).
	app.enableCors({
		origin: configService.get('corsOrigin', { infer: true }),
		credentials: true,
	});

	const port = configService.get('port', { infer: true });
	await app.listen(port);
}
bootstrap();