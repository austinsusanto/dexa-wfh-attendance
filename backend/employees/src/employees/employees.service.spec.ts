import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import {
	CLIENT_TOKEN,
	CreateEmployeePayload,
	IDENTITY_CMD,
} from '@dexa/common/messaging';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';

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

describe('EmployeesService', () => {
	let service: EmployeesService;
	let repo: {
		existsBy: jest.Mock;
		save: jest.Mock;
		create: jest.Mock;
		delete: jest.Mock;
		findOne: jest.Mock;
		find: jest.Mock;
		createQueryBuilder: jest.Mock;
	};
	let identityClient: { send: jest.Mock };

	const basePayload: CreateEmployeePayload = {
		employeeNumber: 'EMP010',
		fullName: 'Test User',
		position: 'Engineer',
		department: 'Tech',
		email: 'test@dexa.com',
		phone: '0800',
		initialPassword: 'Secret123',
	};

	beforeEach(async () => {
		repo = {
			existsBy: jest.fn().mockResolvedValue(false),
			save: jest.fn((e) => Promise.resolve({ id: 42, ...e })),
			create: jest.fn((e) => e),
			delete: jest.fn().mockResolvedValue(undefined),
			findOne: jest.fn(),
			find: jest.fn(),
			createQueryBuilder: jest.fn(),
		};
		identityClient = { send: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				EmployeesService,
				{ provide: getRepositoryToken(Employee), useValue: repo },
				{ provide: CLIENT_TOKEN.IDENTITY, useValue: identityClient },
			],
		}).compile();

		service = module.get(EmployeesService);
	});

	describe('create (saga)', () => {
		it('persists the employee and provisions its login account', async () => {
			repo.existsBy.mockResolvedValue(false);
			identityClient.send
				.mockReturnValueOnce(of(false)) // EXISTS_BY_EMAIL
				.mockReturnValueOnce(of({ id: 100 })); // CREATE_USER

			const result = await service.create(basePayload);

			expect(result).toMatchObject({ id: 42, email: 'test@dexa.com' });
			// initialPassword is stripped from the employee record.
			expect(repo.save).toHaveBeenCalledWith(
				expect.not.objectContaining({
					initialPassword: expect.anything(),
				}),
			);
			expect(identityClient.send).toHaveBeenNthCalledWith(
				2,
				IDENTITY_CMD.CREATE_USER,
				{
					email: 'test@dexa.com',
					password: 'Secret123',
					employeeId: 42,
				},
			);
			expect(repo.delete).not.toHaveBeenCalled();
		});

		it('rejects a duplicate employee number with 409', async () => {
			repo.existsBy.mockImplementation(
				(where: { employeeNumber?: string }) =>
					Promise.resolve(Boolean(where.employeeNumber)),
			);

			await expectRpcStatus(
				service.create(basePayload),
				HttpStatus.CONFLICT,
			);
			expect(repo.save).not.toHaveBeenCalled();
		});

		it('rejects a duplicate employee email with 409', async () => {
			repo.existsBy.mockImplementation((where: { email?: string }) =>
				Promise.resolve(Boolean(where.email)),
			);

			await expectRpcStatus(
				service.create(basePayload),
				HttpStatus.CONFLICT,
			);
		});

		it('rejects when Identity already has a user with that email (409)', async () => {
			repo.existsBy.mockResolvedValue(false);
			identityClient.send.mockReturnValueOnce(of(true)); // EXISTS_BY_EMAIL

			await expectRpcStatus(
				service.create(basePayload),
				HttpStatus.CONFLICT,
			);
			expect(repo.save).not.toHaveBeenCalled();
		});

		it('compensates by hard-deleting the employee when user creation fails', async () => {
			repo.existsBy.mockResolvedValue(false);
			identityClient.send
				.mockReturnValueOnce(of(false)) // EXISTS_BY_EMAIL
				.mockReturnValueOnce(
					throwError(() => ({
						statusCode: HttpStatus.CONFLICT,
						message: 'boom',
					})),
				); // CREATE_USER fails

			await expect(service.create(basePayload)).rejects.toBeDefined();
			expect(repo.delete).toHaveBeenCalledWith(42);
		});
	});

	describe('findOne', () => {
		it('returns the employee when found', async () => {
			const employee = { id: 1, fullName: 'A' };
			repo.findOne.mockResolvedValue(employee);
			await expect(service.findOne(1)).resolves.toBe(employee);
		});

		it('throws 404 when missing', async () => {
			repo.findOne.mockResolvedValue(null);
			await expectRpcStatus(service.findOne(999), HttpStatus.NOT_FOUND);
		});
	});

	describe('update', () => {
		it('rejects changing to an already-used employee number with 409', async () => {
			repo.findOne.mockResolvedValue({
				id: 1,
				employeeNumber: 'EMP001',
			});
			repo.existsBy.mockResolvedValue(true);

			await expectRpcStatus(
				service.update(1, { employeeNumber: 'EMP999' }),
				HttpStatus.CONFLICT,
			);
		});

		it('saves the merged changes', async () => {
			repo.findOne.mockResolvedValue({
				id: 1,
				employeeNumber: 'EMP001',
				fullName: 'Old',
			});

			await service.update(1, { fullName: 'New' });

			expect(repo.save).toHaveBeenCalledWith(
				expect.objectContaining({ id: 1, fullName: 'New' }),
			);
		});
	});

	it('remove soft-deletes by flipping is_active to false', async () => {
		repo.findOne.mockResolvedValue({ id: 1, isActive: true });

		await service.remove(1);

		expect(repo.save).toHaveBeenCalledWith(
			expect.objectContaining({ id: 1, isActive: false }),
		);
	});

	describe('findByIds', () => {
		it('returns [] for an empty id list without hitting the repo', async () => {
			await expect(service.findByIds([])).resolves.toEqual([]);
			expect(repo.find).not.toHaveBeenCalled();
		});

		it('looks up employees for the given ids', async () => {
			const rows = [{ id: 1 }, { id: 2 }];
			repo.find.mockResolvedValue(rows);
			await expect(service.findByIds([1, 2])).resolves.toBe(rows);
		});
	});

	describe('getActiveStatus', () => {
		it('returns the id/isActive pair when found', async () => {
			repo.findOne.mockResolvedValue({ id: 3, isActive: true });
			await expect(service.getActiveStatus(3)).resolves.toEqual({
				id: 3,
				isActive: true,
			});
		});

		it('returns null when the employee does not exist', async () => {
			repo.findOne.mockResolvedValue(null);
			await expect(service.getActiveStatus(3)).resolves.toBeNull();
		});
	});

	describe('findAll', () => {
		it('paginates and applies the search filter', async () => {
			const qb = {
				where: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				skip: jest.fn().mockReturnThis(),
				take: jest.fn().mockReturnThis(),
				getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
			};
			repo.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findAll({
				page: 1,
				limit: 10,
				search: 'budi',
			});

			expect(qb.where).toHaveBeenCalled(); // search Brackets applied
			expect(result).toMatchObject({
				items: [{ id: 1 }],
				meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
			});
		});
	});
});
