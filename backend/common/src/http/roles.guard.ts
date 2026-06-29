import {
	CanActivate,
	ExecutionContext,
	ForbiddenException,
	Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from './roles.decorator';
import { UserRole } from '../enums/app.enum';
import { AuthenticatedUser } from '../types/auth.types';

/**
 * Authorization guard. Reads roles declared via `@Roles(...)` and allows the
 * request only if the authenticated user's role is among them. Routes without
 * `@Roles` are unrestricted (authentication is still handled by JwtAuthGuard).
 *
 * Must run after JwtAuthGuard so `request.user` is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private readonly reflector: Reflector) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
			ROLES_KEY,
			[context.getHandler(), context.getClass()],
		);

		if (!requiredRoles || requiredRoles.length === 0) {
			return true;
		}

		const request = context
			.switchToHttp()
			.getRequest<Request & { user?: AuthenticatedUser }>();
		const user = request.user;

		if (!user || !requiredRoles.includes(user.role)) {
			throw new ForbiddenException(
				'You do not have permission to access this resource',
			);
		}

		return true;
	}
}
