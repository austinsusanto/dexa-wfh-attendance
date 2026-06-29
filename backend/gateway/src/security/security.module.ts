import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppConfig } from '../config/config.types';

/**
 * Global security wiring for the gateway: configures the JWT verifier with the
 * shared secret and re-exports it app-wide. The guards themselves
 * (`JwtAuthGuard`, `RolesGuard`) are applied via `@UseGuards(...)`; Nest
 * instantiates them on demand, resolving their deps (Reflector, JwtService, the
 * Identity client) from the global scope — so they need no explicit providers.
 */
@Global()
@Module({
	imports: [
		JwtModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) => ({
				secret: configService.get('jwt', { infer: true }).secret,
			}),
		}),
	],
	exports: [JwtModule],
})
export class SecurityModule {}
