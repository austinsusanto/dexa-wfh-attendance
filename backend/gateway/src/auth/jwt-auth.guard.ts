import {
	CanActivate,
	ExecutionContext,
	Inject,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { CLIENT_TOKEN, IDENTITY_CMD, sendRpc } from '@dexa/common/messaging';
import { AuthenticatedUser, JwtPayload } from '@dexa/common/types';

/**
 * Authentication guard for the gateway. Verifies the Bearer token's signature
 * locally (shared secret), then asks the Identity service to re-validate the
 * subject on every request — confirming the user still exists and, for an
 * employee, has not been deactivated. The resolved user is attached to `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		@Inject(CLIENT_TOKEN.IDENTITY)
		private readonly identityClient: ClientProxy,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context
			.switchToHttp()
			.getRequest<Request & { user?: AuthenticatedUser }>();
		const header = request.headers.authorization;

		if (!header?.startsWith('Bearer ')) {
			throw new UnauthorizedException(
				'Missing or invalid Authorization header',
			);
		}

		const token = header.slice('Bearer '.length);
		let payload: JwtPayload;
		try {
			payload = await this.jwtService.verifyAsync<JwtPayload>(token);
		} catch {
			throw new UnauthorizedException('Invalid or expired token');
		}

		const user = await sendRpc<AuthenticatedUser>(
			this.identityClient,
			IDENTITY_CMD.VALIDATE_TOKEN,
			{ userId: payload.sub },
		);

		request.user = user;
		return true;
	}
}
