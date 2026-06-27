import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './config/config.types';
import { configureApp } from './common/setup/configure-app';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	const configService = app.get(ConfigService<AppConfig, true>);

	// Shared global setup (prefix, validation, response envelope).
	configureApp(app);

	// Serve uploaded attendance photos at /uploads (outside the /api/v1 prefix).
	const uploadDir = configService.get('uploadDir', { infer: true });
	app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads' });

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
