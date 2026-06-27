import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AppConfig } from '../config/config.types';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication module: login + JWT issuing/validation. Depends on
 * UsersModule's service (not its repository) to keep the boundary clean.
 */
@Module({
	imports: [
		UsersModule,
		PassportModule,
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => {
				const jwt = configService.get('jwt', { infer: true });
				const signOptions: JwtSignOptions = {
					// env vars are plain strings; assert the library's stricter
					// duration type (e.g. '1d'). Compile-time only, no runtime effect.
					expiresIn: jwt.expiresIn as JwtSignOptions['expiresIn'],
				};
				return { secret: jwt.secret, signOptions };
			},
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
