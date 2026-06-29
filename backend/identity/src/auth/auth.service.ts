import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@dexa/common/enums';
import { AuthenticatedUser, JwtPayload } from '@dexa/common/types';
import {
	CLIENT_TOKEN,
	EMPLOYEES_CMD,
	EmployeeActiveStatus,
	LoginResult,
	rpcForbidden,
	rpcUnauthorized,
	sendRpc,
} from '@dexa/common/messaging';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly usersService: UsersService,
		private readonly jwtService: JwtService,
		@Inject(CLIENT_TOKEN.EMPLOYEES)
		private readonly employeesClient: ClientProxy,
	) {}

	/**
	 * Verifies credentials. Throws 401 on unknown email or wrong password
	 * (same message for both, to avoid leaking which emails exist), and 403 if
	 * the linked employee has been deactivated.
	 */
	async validateUser(
		email: string,
		password: string,
	): Promise<AuthenticatedUser> {
		const user = await this.usersService.findByEmailForAuth(email);
		if (!user || !(await bcrypt.compare(password, user.password))) {
			rpcUnauthorized('Invalid email or password');
		}

		await this.assertEmployeeActive(user.role, user.employeeId);

		return {
			id: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};
	}

	/** Validates credentials and issues a signed JWT access token. */
	async login(email: string, password: string): Promise<LoginResult> {
		const user = await this.validateUser(email, password);

		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};

		const accessToken = await this.jwtService.signAsync(payload);
		return { accessToken, user };
	}

	/**
	 * Re-checks a token's subject on every authenticated request (called by the
	 * gateway guard): the user must still exist, and a deactivated employee's
	 * session is revoked. Mirrors the monolith's JwtStrategy.validate.
	 */
	async validateToken(userId: number): Promise<AuthenticatedUser> {
		const user = await this.usersService.findById(userId);
		if (!user) {
			rpcUnauthorized('User no longer exists');
		}

		// Mid-session: a revoked employee gets 401 so the frontend auto-logs out
		// (matching the monolith's JwtStrategy.validate behaviour).
		await this.assertEmployeeActive(
			user.role,
			user.employeeId,
			rpcUnauthorized,
			'Akun Anda telah dinonaktifkan.',
		);

		return {
			id: user.id,
			email: user.email,
			role: user.role,
			employeeId: user.employeeId,
		};
	}

	/**
	 * For EMPLOYEE accounts, asks the Employees service whether the linked
	 * employee is still active; throws via `onInactive` if missing/deactivated.
	 * HRD admins have no employee and are always allowed.
	 *
	 * `onInactive` differs by caller: login uses 403 (blocked at the door),
	 * mid-session validation uses 401 (revoke the session → auto-logout).
	 */
	private async assertEmployeeActive(
		role: UserRole,
		employeeId: number | null,
		onInactive: (message: string) => never = rpcForbidden,
		message = 'Akun Anda telah dinonaktifkan. Hubungi HRD.',
	): Promise<void> {
		if (role !== UserRole.EMPLOYEE) {
			return;
		}

		if (!employeeId) {
			onInactive(message);
		}

		const status = await sendRpc<EmployeeActiveStatus | null>(
			this.employeesClient,
			EMPLOYEES_CMD.GET_ACTIVE_STATUS,
			{ id: employeeId },
		);

		if (!status || !status.isActive) {
			onInactive(message);
		}
	}
}
