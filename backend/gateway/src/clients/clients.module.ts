import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CLIENT_TOKEN } from '@dexa/common/messaging';
import { AppConfig } from '../config/config.types';

/**
 * Registers a TCP `ClientProxy` for each downstream service. Global so any
 * gateway controller can inject them. The gateway is the single HTTP entry
 * point; all business logic is reached over these proxies.
 */
@Global()
@Module({
	providers: [
		{
			provide: CLIENT_TOKEN.IDENTITY,
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => {
				const { host, port } = configService.get('identityClient', {
					infer: true,
				});
				return ClientProxyFactory.create({
					transport: Transport.TCP,
					options: { host, port },
				});
			},
		},
		{
			provide: CLIENT_TOKEN.EMPLOYEES,
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => {
				const { host, port } = configService.get('employeesClient', {
					infer: true,
				});
				return ClientProxyFactory.create({
					transport: Transport.TCP,
					options: { host, port },
				});
			},
		},
		{
			provide: CLIENT_TOKEN.ATTENDANCES,
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => {
				const { host, port } = configService.get('attendancesClient', {
					infer: true,
				});
				return ClientProxyFactory.create({
					transport: Transport.TCP,
					options: { host, port },
				});
			},
		},
	],
	exports: [
		CLIENT_TOKEN.IDENTITY,
		CLIENT_TOKEN.EMPLOYEES,
		CLIENT_TOKEN.ATTENDANCES,
	],
})
export class ClientsModule {}
