import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { CLIENT_TOKEN } from '@dexa/common/messaging';
import { AppConfig } from '../config/config.types';

/**
 * Provides a TCP `ClientProxy` to the Employees service. Attendances uses it to
 * enrich the HRD monitoring view with employee name/NIK, since it only stores
 * `employeeId`.
 */
@Module({
	providers: [
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
	],
	exports: [CLIENT_TOKEN.EMPLOYEES],
})
export class EmployeesClientModule {}
