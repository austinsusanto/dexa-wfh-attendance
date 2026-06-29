import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration, { validateEnv } from './config/configuration';
import { ClientsModule } from './clients/clients.module';
import { SecurityModule } from './security/security.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendancesModule } from './attendances/attendances.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			validate: validateEnv,
		}),
		ClientsModule,
		SecurityModule,
		AuthModule,
		EmployeesModule,
		AttendancesModule,
		UploadsModule,
	],
})
export class AppModule {}
