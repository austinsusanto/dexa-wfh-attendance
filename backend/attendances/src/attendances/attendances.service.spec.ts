import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { of } from 'rxjs';
import { AttendanceType, UserRole } from '@dexa/common/enums';
import { CLIENT_TOKEN, CreateAttendancePayload } from '@dexa/common/messaging';
import { AttendancesService } from './attendances.service';
import { Attendance } from './entities/attendance.entity';
import { StorageService } from '../storage/storage.service';

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

const employeeUser = {
	id: 2,
	email: 'budi@dexa.com',
	role: UserRole.EMPLOYEE,
	employeeId: 5,
};

function buildPayload(
	overrides: Partial<CreateAttendancePayload> = {},
): CreateAttendancePayload {
	return {
		user: employeeUser,
		type: AttendanceType.CLOCK_IN,
		photo: {
			originalName: 'proof.jpg',
			mimeType: 'image/jpeg',
			size: 1024,
			base64: Buffer.from('hello').toString('base64'),
		},
		...overrides,
	};
}

describe('AttendancesService', () => {
	let service: AttendancesService;
	let repo: {
		existsBy: jest.Mock;
		create: jest.Mock;
		save: jest.Mock;
		findOne: jest.Mock;
		createQueryBuilder: jest.Mock;
	};
	let storage: { put: jest.Mock; remove: jest.Mock };
	let employeesClient: { send: jest.Mock };

	beforeEach(async () => {
		repo = {
			existsBy: jest.fn().mockResolvedValue(false),
			create: jest.fn((e) => e),
			save: jest.fn((e) => Promise.resolve({ id: 1, ...e })),
			findOne: jest.fn(),
			createQueryBuilder: jest.fn(),
		};
		storage = {
			put: jest.fn().mockResolvedValue(undefined),
			remove: jest.fn().mockResolvedValue(undefined),
		};
		employeesClient = { send: jest.fn() };

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AttendancesService,
				{ provide: getRepositoryToken(Attendance), useValue: repo },
				{ provide: StorageService, useValue: storage },
				{ provide: CLIENT_TOKEN.EMPLOYEES, useValue: employeesClient },
			],
		}).compile();

		service = module.get(AttendancesService);
	});

	describe('create', () => {
		it('stores the photo, stamps the server time, and persists the punch', async () => {
			const result = await service.create(buildPayload());

			expect(storage.put).toHaveBeenCalledTimes(1);
			expect(repo.save).toHaveBeenCalled();
			const saved = repo.create.mock.calls[0][0];
			// Date/time come from the server, not the client.
			expect(saved.checkedInAt).toBeInstanceOf(Date);
			expect(saved.attendanceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(saved.employeeId).toBe(5);
			expect(result).toMatchObject({
				id: 1,
				type: AttendanceType.CLOCK_IN,
			});
		});

		it('rejects a missing photo with 400', async () => {
			const payload = buildPayload();
			// @ts-expect-error deliberately drop the photo
			payload.photo = undefined;
			await expectRpcStatus(
				service.create(payload),
				HttpStatus.BAD_REQUEST,
			);
		});

		it('rejects a non-image mime type with 400', async () => {
			const payload = buildPayload();
			payload.photo.mimeType = 'application/pdf';
			await expectRpcStatus(
				service.create(payload),
				HttpStatus.BAD_REQUEST,
			);
		});

		it('rejects a user with no linked employee (403)', async () => {
			const payload = buildPayload({
				user: { ...employeeUser, employeeId: null },
			});
			await expectRpcStatus(
				service.create(payload),
				HttpStatus.FORBIDDEN,
			);
		});

		it('rejects a photo over the size limit with 400', async () => {
			const big = Buffer.alloc(6 * 1024 * 1024).toString('base64');
			const payload = buildPayload();
			payload.photo.base64 = big;
			await expectRpcStatus(
				service.create(payload),
				HttpStatus.BAD_REQUEST,
			);
			expect(storage.put).not.toHaveBeenCalled();
		});

		it('rejects a double punch of the same type the same day with 409', async () => {
			repo.existsBy.mockResolvedValue(true);
			await expectRpcStatus(
				service.create(buildPayload()),
				HttpStatus.CONFLICT,
			);
			expect(storage.put).not.toHaveBeenCalled();
		});

		it('removes the orphaned object when the DB save fails', async () => {
			repo.save.mockRejectedValue(new Error('unique race'));
			await expect(service.create(buildPayload())).rejects.toThrow(
				'unique race',
			);
			expect(storage.remove).toHaveBeenCalledTimes(1);
		});
	});

	describe('findOne', () => {
		it('throws 404 when the attendance is missing', async () => {
			repo.findOne.mockResolvedValue(null);
			await expectRpcStatus(
				service.findOne(1, employeeUser),
				HttpStatus.NOT_FOUND,
			);
		});

		it("forbids an employee from viewing another employee's punch (403)", async () => {
			repo.findOne.mockResolvedValue({ id: 1, employeeId: 999 });
			await expectRpcStatus(
				service.findOne(1, employeeUser),
				HttpStatus.FORBIDDEN,
			);
		});

		it('lets an employee view their own punch (enriched)', async () => {
			repo.findOne.mockResolvedValue({ id: 1, employeeId: 5 });
			employeesClient.send.mockReturnValue(
				of([
					{
						id: 5,
						employeeNumber: 'EMP005',
						fullName: 'Budi',
						position: 'Dev',
						department: 'Tech',
						email: 'budi@dexa.com',
						isActive: true,
					},
				]),
			);

			const result = await service.findOne(1, employeeUser);
			expect(result.employee).toMatchObject({ id: 5, fullName: 'Budi' });
		});
	});

	describe('findMine', () => {
		it('filters by the caller employee id and date range', async () => {
			const qb = {
				where: jest.fn().mockReturnThis(),
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				skip: jest.fn().mockReturnThis(),
				take: jest.fn().mockReturnThis(),
				getManyAndCount: jest.fn().mockResolvedValue([[{ id: 1 }], 1]),
			};
			repo.createQueryBuilder.mockReturnValue(qb);

			const result = await service.findMine({
				employeeId: 5,
				page: 1,
				limit: 10,
				from: '2026-06-01',
				to: '2026-06-30',
			});

			expect(qb.where).toHaveBeenCalledWith(
				'attendance.employee_id = :employeeId',
				{ employeeId: 5 },
			);
			expect(qb.andWhere).toHaveBeenCalledTimes(2); // from + to
			expect(result.items).toEqual([{ id: 1 }]);
		});
	});

	describe('findAllForAdmin', () => {
		it('enriches each attendance with its employee summary', async () => {
			const qb = {
				andWhere: jest.fn().mockReturnThis(),
				orderBy: jest.fn().mockReturnThis(),
				skip: jest.fn().mockReturnThis(),
				take: jest.fn().mockReturnThis(),
				getManyAndCount: jest
					.fn()
					.mockResolvedValue([[{ id: 1, employeeId: 5 }], 1]),
			};
			repo.createQueryBuilder.mockReturnValue(qb);
			employeesClient.send.mockReturnValue(
				of([
					{
						id: 5,
						employeeNumber: 'EMP005',
						fullName: 'Budi',
						position: 'Dev',
						department: 'Tech',
						email: 'budi@dexa.com',
						isActive: true,
					},
				]),
			);

			const result = await service.findAllForAdmin({
				page: 1,
				limit: 10,
			});

			expect(result.items[0].employee).toMatchObject({
				fullName: 'Budi',
			});
		});
	});
});
