import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

/**
 * Bootstraps the Identity service as a pure TCP microservice (no HTTP). The
 * API Gateway is the only HTTP boundary and reaches this service over TCP.
 *
 * Transport host/port are read from env here (before the Nest config layer is
 * available); env validation still runs inside AppModule's ConfigModule.
 */
async function bootstrap() {
	const host = process.env.TCP_HOST ?? '0.0.0.0';
	const port = parseInt(process.env.TCP_PORT ?? '4001', 10);

	const app = await NestFactory.createMicroservice<MicroserviceOptions>(
		AppModule,
		{
			transport: Transport.TCP,
			options: { host, port },
		},
	);

	await app.listen();
	Logger.log(
		`Identity service listening on TCP ${host}:${port}`,
		'Bootstrap',
	);
}
bootstrap();
