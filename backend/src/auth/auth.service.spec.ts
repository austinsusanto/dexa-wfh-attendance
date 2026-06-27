import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/app.enum';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

/**
 * Unit test for AuthService. Dependencies (UsersService, JwtService) are mocked,
 * so it runs without a database or HTTP server. Co-located with the auth module
 * so it travels with the service on extraction (PLAN §2).
 */
describe('AuthService', () => {
	let authService: AuthService;
	// Mocked collaborators we control per test.
	const usersService = { findByEmailForAuth: jest.fn(), findById: jest.fn() };
	const jwtService = { signAsync: jest.fn() };

	beforeEach(async () => {
		// Build a tiny module with the real AuthService but mocked dependencies.
		const moduleRef: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: usersService },
				{ provide: JwtService, useValue: jwtService },
			],
		}).compile();

		authService = moduleRef.get(AuthService);
		jest.clearAllMocks(); // reset call history between tests
	});

	it('login returns a token and user for valid credentials', async () => {
		// Arrange: a stored user whose password hash matches 'Admin123'.
		const passwordHash = await bcrypt.hash('Admin123', 10);
		const storedUser = {
			id: 1,
			email: 'admin@dexa.com',
			password: passwordHash,
			role: UserRole.HRD_ADMIN,
			employeeId: null,
		} as User;
		usersService.findByEmailForAuth.mockResolvedValue(storedUser);
		jwtService.signAsync.mockResolvedValue('signed-token');

		// Act: log in.
		const result = await authService.login({
			email: 'admin@dexa.com',
			password: 'Admin123',
		});

		// Assert: token returned and password is never leaked back.
		expect(result.accessToken).toBe('signed-token');
		expect(result.user).toEqual({
			id: 1,
			email: 'admin@dexa.com',
			role: UserRole.HRD_ADMIN,
			employeeId: null,
		});
		// Assert: the JWT payload carries id/role.
		expect(jwtService.signAsync).toHaveBeenCalledWith(
			expect.objectContaining({ sub: 1, role: UserRole.HRD_ADMIN }),
		);
	});

	it('validateUser throws 401 when the email is unknown', async () => {
		// Arrange: no user found.
		usersService.findByEmailForAuth.mockResolvedValue(null);

		// Act + Assert: rejected as unauthorized.
		await expect(
			authService.validateUser('ghost@dexa.com', 'whatever'),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});

	it('validateUser throws 401 when the password is wrong', async () => {
		// Arrange: user exists but stored hash is for a different password.
		const passwordHash = await bcrypt.hash('CorrectPassword', 10);
		usersService.findByEmailForAuth.mockResolvedValue({
			id: 1,
			email: 'admin@dexa.com',
			password: passwordHash,
			role: UserRole.HRD_ADMIN,
			employeeId: null,
		} as User);

		// Act + Assert: wrong password is rejected.
		await expect(
			authService.validateUser('admin@dexa.com', 'WrongPassword'),
		).rejects.toBeInstanceOf(UnauthorizedException);
	});
});
