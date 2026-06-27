import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../users/users.service';
import { Employee } from './entities/employee.entity';
import { EmployeesService } from './employees.service';

/**
 * Unit test for EmployeesService. The repository and UsersService are mocked,
 * so it runs without a database. Co-located with the module (PLAN §2).
 */
describe('EmployeesService', () => {
	let service: EmployeesService;
	// Mocked Employee repository (only the methods we use).
	const employeeRepo = {
		existsBy: jest.fn(),
		create: jest.fn((x) => x),
		save: jest.fn(),
		findOne: jest.fn(),
	};
	// Mocked users domain service.
	const usersService = {
		existsByEmail: jest.fn(),
		createEmployeeUser: jest.fn(),
	};

	const baseDto = {
		employeeNumber: 'EMP100',
		fullName: 'Test User',
		position: 'Engineer',
		department: 'Engineering',
		email: 'test@dexa.com',
		phone: '081200000100',
		initialPassword: 'Employee123',
	};

	beforeEach(async () => {
		const moduleRef: TestingModule = await Test.createTestingModule({
			providers: [
				EmployeesService,
				{ provide: getRepositoryToken(Employee), useValue: employeeRepo },
				{ provide: UsersService, useValue: usersService },
			],
		}).compile();

		service = moduleRef.get(EmployeesService);
		jest.clearAllMocks();
	});

	it('create saves the employee and provisions its login account', async () => {
		// No existing number/email/user.
		employeeRepo.existsBy.mockResolvedValue(false);
		usersService.existsByEmail.mockResolvedValue(false);
		employeeRepo.save.mockResolvedValue({ id: 5, ...baseDto, isActive: true });

		const result = await service.create(baseDto);

		expect(result.id).toBe(5);
		// The login account is created via UsersService, linked by employeeId.
		expect(usersService.createEmployeeUser).toHaveBeenCalledWith({
			email: baseDto.email,
			password: baseDto.initialPassword,
			employeeId: 5,
		});
	});

	it('create throws 409 when the employee number already exists', async () => {
		// First existsBy (number) returns true.
		employeeRepo.existsBy.mockResolvedValueOnce(true);

		await expect(service.create(baseDto)).rejects.toBeInstanceOf(
			ConflictException,
		);
		expect(employeeRepo.save).not.toHaveBeenCalled();
		expect(usersService.createEmployeeUser).not.toHaveBeenCalled();
	});

	it('findOne throws 404 when the employee is missing', async () => {
		employeeRepo.findOne.mockResolvedValue(null);

		await expect(service.findOne(999)).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('remove soft-deletes by setting isActive to false', async () => {
		const employee = { id: 1, isActive: true };
		employeeRepo.findOne.mockResolvedValue(employee);
		employeeRepo.save.mockImplementation((e) => Promise.resolve(e));

		const result = await service.remove(1);

		expect(result.isActive).toBe(false);
	});
});
