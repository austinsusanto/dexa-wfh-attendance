import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/config.types';
import { configureApp } from './common/setup/configure-app';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService<AppConfig, true>);

	// Shared global setup (prefix, validation, response envelope).
	configureApp(app);

	// Interactive API docs at /api/docs.
	setupSwagger(app);

	// Restrict CORS to the configured frontend origin(s).
	app.enableCors({
		origin: configService.get('corsOrigin', { infer: true }),
		credentials: true,
	});

	const port = configService.get('port', { infer: true });
	await app.listen(port);
}
bootstrap();
