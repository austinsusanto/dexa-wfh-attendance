import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Brackets, In, Repository } from 'typeorm';
import {
	CLIENT_TOKEN,
	CreateEmployeePayload,
	EmployeeActiveStatus,
	EmployeeDto,
	EmployeeQueryPayload,
	IDENTITY_CMD,
	UpdateEmployeePayload,
	rpcConflict,
	rpcNotFound,
	sendRpc,
} from '@dexa/common/messaging';
import { PaginatedResult } from '@dexa/common/types';
import { buildPaginatedResult, getSkip } from '@dexa/common/utils';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService {
	private readonly logger = new Logger(EmployeesService.name);

	constructor(
		@InjectRepository(Employee)
		private readonly employeeRepo: Repository<Employee>,
		@Inject(CLIENT_TOKEN.IDENTITY)
		private readonly identityClient: ClientProxy,
	) {}

	/**
	 * Creates an employee plus its EMPLOYEE login account in the Identity
	 * service. This spans two services, so it runs as a saga: persist the
	 * employee, ask Identity to create the user, and on failure compensate by
	 * hard-deleting the just-created employee so we never leave an orphan.
	 */
	async create(payload: CreateEmployeePayload): Promise<Employee> {
		const { initialPassword, ...employeeData } = payload;

		if (
			await this.employeeRepo.existsBy({
				employeeNumber: employeeData.employeeNumber,
			})
		) {
			rpcConflict('Employee number already exists');
		}
		if (await this.employeeRepo.existsBy({ email: employeeData.email })) {
			rpcConflict('Employee email already exists');
		}

		// Pre-check the login side so we can fail before writing anything.
		const emailTaken = await sendRpc<boolean>(
			this.identityClient,
			IDENTITY_CMD.EXISTS_BY_EMAIL,
			{ email: employeeData.email },
		);
		if (emailTaken) {
			rpcConflict('A user with this email already exists');
		}

		const employee = await this.employeeRepo.save(
			this.employeeRepo.create({ ...employeeData, isActive: true }),
		);

		try {
			await sendRpc(this.identityClient, IDENTITY_CMD.CREATE_USER, {
				email: employee.email,
				password: initialPassword,
				employeeId: employee.id,
			});
		} catch (error) {
			// Compensating action: undo the employee so the two services stay
			// consistent even though there is no distributed transaction.
			await this.employeeRepo.delete(employee.id);
			this.logger.warn(
				`Rolled back employee ${employee.id} after user creation failed`,
			);
			throw error;
		}

		return employee;
	}

	/** Lists employees with pagination and optional free-text search. */
	async findAll(
		query: EmployeeQueryPayload,
	): Promise<PaginatedResult<Employee>> {
		const { page, limit, search } = query;
		const qb = this.employeeRepo.createQueryBuilder('employee');

		if (search) {
			const term = `%${search}%`;
			qb.where(
				new Brackets((where) => {
					where
						.where('employee.full_name LIKE :term', { term })
						.orWhere('employee.employee_number LIKE :term', {
							term,
						})
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
			rpcNotFound('Employee not found');
		}
		return employee;
	}

	/** Updates an employee's data (email/password not changeable here). */
	async update(id: number, dto: UpdateEmployeePayload): Promise<Employee> {
		const employee = await this.findOne(id);

		if (
			dto.employeeNumber &&
			dto.employeeNumber !== employee.employeeNumber &&
			(await this.employeeRepo.existsBy({
				employeeNumber: dto.employeeNumber,
			}))
		) {
			rpcConflict('Employee number already exists');
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

	/** Returns employees for the given ids (attendance monitoring enrichment). */
	findByIds(ids: number[]): Promise<Employee[]> {
		if (ids.length === 0) {
			return Promise.resolve([]);
		}
		return this.employeeRepo.find({ where: { id: In(ids) } });
	}

	/** Active-status lookup used by Identity to enforce the deactivation rule. */
	async getActiveStatus(id: number): Promise<EmployeeActiveStatus | null> {
		const employee = await this.employeeRepo.findOne({
			where: { id },
			select: { id: true, isActive: true },
		});
		return employee
			? { id: employee.id, isActive: employee.isActive }
			: null;
	}
}
