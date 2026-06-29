import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IDENTITY_CMD } from '@dexa/common/messaging';
import type {
	LoginPayload,
	LoginResult,
	ValidateTokenPayload,
} from '@dexa/common/messaging';
import type { AuthenticatedUser } from '@dexa/common/types';
import { AuthService } from './auth.service';

/**
 * TCP message-pattern handlers for authentication. No HTTP — the gateway is the
 * only HTTP boundary and forwards these commands over TCP.
 */
@Controller()
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@MessagePattern(IDENTITY_CMD.LOGIN)
	login(@Payload() payload: LoginPayload): Promise<LoginResult> {
		return this.authService.login(payload.email, payload.password);
	}

	@MessagePattern(IDENTITY_CMD.VALIDATE_TOKEN)
	validateToken(
		@Payload() payload: ValidateTokenPayload,
	): Promise<AuthenticatedUser> {
		return this.authService.validateToken(payload.userId);
	}
}
