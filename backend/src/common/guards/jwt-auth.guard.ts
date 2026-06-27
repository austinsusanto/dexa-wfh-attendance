import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authentication guard backed by the 'jwt' Passport strategy.
 * Validates the `Authorization: Bearer <token>` header and attaches
 * the decoded user to `request.user`; rejects with 401 when missing/invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}