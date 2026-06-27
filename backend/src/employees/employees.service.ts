import {
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { PaginatedResult } from '../common/types/pagination.types';
import {
	buildPaginatedResult,
	getSkip,
} from '../common/utils/pagination.util';
import { UsersService } from '../users/users.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
	constructor(
		@InjectRepository(Employee)
		private readonly employeeRepo: Repository<Employee>,
		private readonly usersService: UsersService,
	) {}

	/**
	 * Creates an employee plus its EMPLOYEE login account. Uniqueness is checked
	 * up front; account creation is delegated to UsersService to keep the domain
	 * boundary clean.
	 */
	async create(dto: CreateEmployeeDto): Promise<Employee> {
		const { initialPassword, ...employeeData } = dto;

		if (await this.employeeRepo.existsBy({ employeeNumber: dto.employeeNumber })) {
			throw new ConflictException('Employee number already exists');
		}
		if (await this.employeeRepo.existsBy({ email: dto.email })) {
			throw new ConflictException('Employee email already exists');
		}
		if (await this.usersService.existsByEmail(dto.email)) {
			throw new ConflictException('A user with this email already exists');
		}

		const employee = await this.employeeRepo.save(
			this.employeeRepo.create({ ...employeeData, isActive: true }),
		);

		await this.usersService.createEmployeeUser({
			email: employee.email,
			password: initialPassword,
			employeeId: employee.id,
		});

		return employee;
	}

	/** Lists employees with pagination and optional free-text search. */
	async findAll(query: EmployeeQueryDto): Promise<PaginatedResult<Employee>> {
		const { page, limit, search } = query;
		const qb = this.employeeRepo.createQueryBuilder('employee');

		if (search) {
			const term = `%${search}%`;
			qb.where(
				new Brackets((where) => {
					where
						.where('employee.full_name LIKE :term', { term })
						.orWhere('employee.employee_number LIKE :term', { term })
						.orWhere('employee.email LIKE :term', { term })
						.orWhere('employee.position LIKE :term', { term })
						.orWhere('employee.department LIKE :term', { term });
				}),
			);
		}

		const [items, total] = await qb
			.orderBy('employee.id', 'DESC')
			.skip(getSkip(page, limit))
			.take(limit)
			.getManyAndCount();

		return buildPaginatedResult(items, total, page, limit);
	}

	/** Returns one employee or throws 404. */
	async findOne(id: number): Promise<Employee> {
		const employee = await this.employeeRepo.findOne({ where: { id } });
		if (!employee) {
			throw new NotFoundException('Employee not found');
		}
		return employee;
	}

	/** Updates an employee's data (email/password not changeable here). */
	async update(id: number, dto: UpdateEmployeeDto): Promise<Employee> {
		const employee = await this.findOne(id);

		if (
			dto.employeeNumber &&
			dto.employeeNumber !== employee.employeeNumber &&
			(await this.employeeRepo.existsBy({ employeeNumber: dto.employeeNumber }))
		) {
			throw new ConflictException('Employee number already exists');
		}

		Object.assign(employee, dto);
		return this.employeeRepo.save(employee);
	}

	/** Soft-deletes an employee (is_active=false) to keep attendance history. */
	async remove(id: number): Promise<Employee> {
		const employee = await this.findOne(id);
		employee.isActive = false;
		return this.employeeRepo.save(employee);
	}
}