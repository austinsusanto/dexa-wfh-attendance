import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../types/auth.types';

/**
 * Param decorator that extracts the authenticated user from the request
 * (populated by JwtStrategy). Use on guarded routes: `@CurrentUser() user`.
 */
export const CurrentUser = createParamDecorator(
	(_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
		const request = ctx.switchToHttp().getRequest<Request>();
		return request.user as AuthenticatedUser;
	},
);