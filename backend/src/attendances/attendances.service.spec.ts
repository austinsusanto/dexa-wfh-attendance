import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserRole } from '../common/enums/app.enum';
import { AuthenticatedUser } from '../common/types/auth.types';
import { AttendancesService } from './attendances.service';
import { Attendance } from './entities/attendance.entity';
import { AttendanceType } from './enums/attendance.enum';

/**
 * Unit test for AttendancesService. Repository and config are mocked, so it runs
 * without a database or real files. Co-located with the module.
 */
describe('AttendancesService', () => {
	let service: AttendancesService;
	const attendanceRepo = {
		existsBy: jest.fn(),
		create: jest.fn((x) => x),
		save: jest.fn(),
		findOne: jest.fn(),
	};
	const configService = { get: jest.fn().mockReturnValue('uploads') };

	const employee: AuthenticatedUser = {
		id: 2,
		email: 'budi@dexa.com',
		role: UserRole.EMPLOYEE,
		employeeId: 1,
	};
	// A fake Multer file (path/filename are all the service touches).
	const file = {
		path: '/tmp/never-exists.png',
		filename: 'att-emp1-x.png',
	} as Express.Multer.File;

	beforeEach(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			providers: [
				AttendancesService,
				{ provide: getRepositoryToken(Attendance), useValue: attendanceRepo },
				{ provide: ConfigService, useValue: configService },
			],
		}).compile();

		service = moduleRef.get(AttendancesService);
		jest.clearAllMocks();
	});

	it('create stores the punch with a server-built photo path', async () => {
		attendanceRepo.existsBy.mockResolvedValue(false);
		attendanceRepo.save.mockImplementation((a) => Promise.resolve({ id: 1, ...a }));

		const result = await service.create(employee, file, {});

		expect(result.photoPath).toBe(`uploads/attendances/${file.filename}`);
		expect(result.type).toBe(AttendanceType.CLOCK_IN);
		expect(result.employeeId).toBe(1);
	});

	it('create throws 400 when no photo is provided', async () => {
		await expect(
			service.create(employee, undefined, {}),
		).rejects.toBeInstanceOf(BadRequestException);
	});

	it('create throws 409 on a double punch of the same type today', async () => {
		attendanceRepo.existsBy.mockResolvedValue(true); // already punched

		await expect(service.create(employee, file, {})).rejects.toBeInstanceOf(
			ConflictException,
		);
		expect(attendanceRepo.save).not.toHaveBeenCalled();
	});

	it('findOne throws 404 when missing', async () => {
		attendanceRepo.findOne.mockResolvedValue(null);

		await expect(service.findOne(99, employee)).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('findOne forbids an employee from viewing another employee record', async () => {
		// Record belongs to employeeId 2, requester is employeeId 1.
		attendanceRepo.findOne.mockResolvedValue({ id: 5, employeeId: 2 });

		await expect(service.findOne(5, employee)).rejects.toBeInstanceOf(
			ForbiddenException,
		);
	});
});
