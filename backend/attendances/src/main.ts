import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Bootstraps the Attendances service as a pure TCP microservice (no HTTP).
 * Transport host/port come from env; env validation runs inside AppModule.
 */
async function bootstrap() {
	const host = process.env.TCP_HOST ?? '0.0.0.0';
	const port = parseInt(process.env.TCP_PORT ?? '4003', 10);

	const app = await NestFactory.createMicroservice<MicroserviceOptions>(
		AppModule,
		{
			transport: Transport.TCP,
			options: { host, port },
		},
	);

	await app.listen();
	Logger.log(
		`Attendances service listening on TCP ${host}:${port}`,
		'Bootstrap',
	);
}
bootstrap();
