import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CLIENT_TOKEN } from '@dexa/common/messaging';
import { AppConfig } from '../config/config.types';

/**
 * Provides a TCP `ClientProxy` to the Identity service. Employees uses it to
 * provision the EMPLOYEE login account when creating an employee.
 */
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
	],
	exports: [CLIENT_TOKEN.IDENTITY],
})
export class IdentityClientModule {}
