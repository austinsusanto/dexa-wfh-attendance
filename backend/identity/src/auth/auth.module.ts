import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { AppConfig } from '../config/config.types';
import { EmployeesClientModule } from '../clients/employees-client.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

/**
 * Authentication module: login + JWT issuing/validation over TCP. Token
 * verification itself happens at the gateway; this service only signs (it owns
 * the users table and the shared secret).
 */
@Module({
	imports: [
		UsersModule,
		EmployeesClientModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => {
				const jwt = configService.get('jwt', { infer: true });
				const signOptions: JwtSignOptions = {
					expiresIn: jwt.expiresIn as JwtSignOptions['expiresIn'],
				};
				return { secret: jwt.secret, signOptions };
			},
		}),
	],
	controllers: [AuthController],
	providers: [AuthService],
})
export class AuthModule {}
