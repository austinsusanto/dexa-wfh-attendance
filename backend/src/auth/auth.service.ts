import {
	ForbiddenException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/app.enum';
import {
	AuthenticatedUser,
	JwtPayload,
} from '../common/types/auth.types';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { LoginResult } from './auth.types';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
	) {}

	/**
	 * Verifies credentials. Throws 401 on unknown email or wrong password.
	 * The same message is used for both to avoid leaking which emails exist.
	 */
	async validateUser(
		email: string,
		password: string,
	): Promise<AuthenticatedUser> {
		const user = await this.usersService.findByEmailForAuth(email);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			throw new UnauthorizedException('Invalid email or password');
		}

		// A deactivated employee can no longer access the system.
		if (
			user.role === UserRole.EMPLOYEE &&
			(!user.employee || !user.employee.isActive)
		) {
			throw new ForbiddenException(
				'Akun Anda telah dinonaktifkan. Hubungi HRD.',
			);
		}

		return {
			id: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};
	}

	/** Validates credentials and issues a signed JWT access token. */
	async login(dto: LoginDto): Promise<LoginResult> {
		const user = await this.validateUser(dto.email, dto.password);

		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};

		const accessToken = await this.jwtService.signAsync(payload);
		return { accessToken, user };
	}
}
