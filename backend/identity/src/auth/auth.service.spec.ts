import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@dexa/common/enums';
import { CLIENT_TOKEN } from '@dexa/common/messaging';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

jest.mock('bcrypt');

/** Asserts a thrown RpcException carries the expected HTTP-style status code. */
async function expectRpcStatus(
	promise: Promise<unknown>,
	statusCode: HttpStatus,
): Promise<void> {
	await expect(promise).rejects.toBeInstanceOf(RpcException);
	await promise.catch((error: RpcException) => {
		expect(error.getError()).toMatchObject({ statusCode });
	});
}

describe('AuthService', () => {
	let service: AuthService;
	let usersService: {
		findByEmailForAuth: jest.Mock;
		findById: jest.Mock;
	};
	let jwtService: { signAsync: jest.Mock };
	let employeesClient: { send: jest.Mock };

	const hrdUser = {
		id: 1,
		email: 'admin@dexa.com',
		password: 'hashed',
		role: UserRole.HRD_ADMIN,
		employeeId: null,
	};
	const employeeUser = {
		id: 2,
		email: 'budi@dexa.com',
		password: 'hashed',
		role: UserRole.EMPLOYEE,
		employeeId: 5,
	};

	beforeEach(async () => {
		usersService = {
			findByEmailForAuth: jest.fn(),
			findById: jest.fn(),
		};
		jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt') };
		employeesClient = { send: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{ provide: UsersService, useValue: usersService },
				{ provide: JwtService, useValue: jwtService },
				{ provide: CLIENT_TOKEN.EMPLOYEES, useValue: employeesClient },
			],
		}).compile();

		service = module.get(AuthService);
		(bcrypt.compare as jest.Mock).mockReset();
	});

	describe('login', () => {
		it('issues a JWT for a valid HRD admin (no employee check)', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(hrdUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);

			const result = await service.login('admin@dexa.com', 'Admin123');

			expect(result.accessToken).toBe('signed.jwt');
			expect(result.user).toEqual({
				id: 1,
				email: 'admin@dexa.com',
				role: UserRole.HRD_ADMIN,
				employeeId: null,
			});
			// HRD has no linked employee, so the Employees service is never queried.
			expect(employeesClient.send).not.toHaveBeenCalled();
		});

		it('issues a JWT for an active employee', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(employeeUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			employeesClient.send.mockReturnValue(of({ id: 5, isActive: true }));

			const result = await service.login('budi@dexa.com', 'Employee123');

			expect(result.accessToken).toBe('signed.jwt');
			expect(employeesClient.send).toHaveBeenCalledTimes(1);
		});

		it('rejects an unknown email with 401', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(null);

			await expectRpcStatus(
				service.login('nope@dexa.com', 'whatever'),
				HttpStatus.UNAUTHORIZED,
			);
		});

		it('rejects a wrong password with 401', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(hrdUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(false);

			await expectRpcStatus(
				service.login('admin@dexa.com', 'wrong'),
				HttpStatus.UNAUTHORIZED,
			);
		});

		it('blocks a deactivated employee at login with 403', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(employeeUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			employeesClient.send.mockReturnValue(
				of({ id: 5, isActive: false }),
			);

			await expectRpcStatus(
				service.login('budi@dexa.com', 'Employee123'),
				HttpStatus.FORBIDDEN,
			);
		});

		it('blocks login when the employee record is missing with 403', async () => {
			usersService.findByEmailForAuth.mockResolvedValue(employeeUser);
			(bcrypt.compare as jest.Mock).mockResolvedValue(true);
			employeesClient.send.mockReturnValue(of(null));

			await expectRpcStatus(
				service.login('budi@dexa.com', 'Employee123'),
				HttpStatus.FORBIDDEN,
			);
		});
	});

	describe('validateToken', () => {
		it('returns the user when it still exists and is active', async () => {
			usersService.findById.mockResolvedValue(employeeUser);
			employeesClient.send.mockReturnValue(of({ id: 5, isActive: true }));

			const result = await service.validateToken(2);

			expect(result).toEqual({
				id: 2,
				email: 'budi@dexa.com',
				role: UserRole.EMPLOYEE,
				employeeId: 5,
			});
		});

		it('revokes the session with 401 when the user no longer exists', async () => {
			usersService.findById.mockResolvedValue(null);

			await expectRpcStatus(
				service.validateToken(99),
				HttpStatus.UNAUTHORIZED,
			);
		});

		it('revokes the session with 401 when the employee was deactivated mid-session', async () => {
			usersService.findById.mockResolvedValue(employeeUser);
			employeesClient.send.mockReturnValue(
				of({ id: 5, isActive: false }),
			);

			await expectRpcStatus(
				service.validateToken(2),
				HttpStatus.UNAUTHORIZED,
			);
		});
	});
});
