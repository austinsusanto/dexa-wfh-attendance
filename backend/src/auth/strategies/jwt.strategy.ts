import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../../config/config.types';
import { UserRole } from '../../common/enums/app.enum';
import {
	AuthenticatedUser,
	JwtPayload,
} from '../../common/types/auth.types';
import { UsersService } from '../../users/users.service';

/**
 * Passport 'jwt' strategy. Reads the Bearer token, verifies its signature and
 * expiry, then `validate()` runs to confirm the user still exists and returns
 * the object Nest attaches to `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		configService: ConfigService<AppConfig, true>,
		private readonly usersService: UsersService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: configService.get('jwt', { infer: true }).secret,
		});
	}

	async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
		const user = await this.usersService.findById(payload.sub);
		if (!user) {
			throw new UnauthorizedException('User no longer exists');
		}

		// Deactivating an employee revokes their active session on the next request.
		if (
			user.role === UserRole.EMPLOYEE &&
			(!user.employee || !user.employee.isActive)
		) {
			throw new UnauthorizedException('Akun Anda telah dinonaktifkan.');
		}

		return {
			id: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};
	}
}
