import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { configureApp, setupSwagger } from '@dexa/common/http';
import { AppModule } from './app.module';
import { AppConfig } from './config/config.types';
import { GatewayStorageService } from './uploads/gateway-storage.service';

/**
 * Bootstraps the API Gateway — the only HTTP boundary of the system. It applies
 * the shared HTTP setup (prefix, validation, envelope), serves attendance
 * photos from MinIO at /uploads/* (outside the prefix), exposes Swagger, and
 * forwards everything else to the TCP services via the controllers.
 */
async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);
	const configService = app.get(ConfigService<AppConfig, true>);

	// Shared global setup (prefix /api/v1, validation, response envelope).
	configureApp(app);

	// Serve attendance photos from object storage (outside the /api/v1 prefix)
	// so existing frontend photo URLs keep resolving against the gateway origin.
	const storage = app.get(GatewayStorageService);
	app.use('/uploads', (req: Request, res: Response) => {
		void storage.stream(req.path, res);
	});

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
