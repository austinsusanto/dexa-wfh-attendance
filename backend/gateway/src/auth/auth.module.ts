import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';

/**
 * Auth HTTP routes (login + me). The JWT verifier and guards live in the global
 * SecurityModule; the Identity client comes from the global ClientsModule.
 */
@Module({
	controllers: [AuthController],
})
export class AuthModule {}
