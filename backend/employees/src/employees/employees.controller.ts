import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EMPLOYEES_CMD } from '@dexa/common/messaging';
import type {
	CreateEmployeePayload,
	EmployeeActiveStatus,
	EmployeeDto,
	EmployeeQueryPayload,
	FindByIdsPayload,
	UpdateEmployeePayload,
} from '@dexa/common/messaging';
import type { PaginatedResult } from '@dexa/common/types';
import { EmployeesService } from './employees.service';

/**
 * TCP message-pattern handlers for the employees domain. The HTTP layer
 * (role-restricted to HRD) lives in the gateway; this service is transport-only.
 */
@Controller()
export class EmployeesController {
	constructor(private readonly employeesService: EmployeesService) {}

	@MessagePattern(EMPLOYEES_CMD.CREATE)
	create(@Payload() payload: CreateEmployeePayload): Promise<EmployeeDto> {
		return this.employeesService.create(payload);
	}

	@MessagePattern(EMPLOYEES_CMD.FIND_ALL)
	findAll(
		@Payload() payload: EmployeeQueryPayload,
	): Promise<PaginatedResult<EmployeeDto>> {
		return this.employeesService.findAll(payload);
	}

	@MessagePattern(EMPLOYEES_CMD.FIND_ONE)
	findOne(@Payload() payload: { id: number }): Promise<EmployeeDto> {
		return this.employeesService.findOne(payload.id);
	}

	@MessagePattern(EMPLOYEES_CMD.UPDATE)
	update(
		@Payload() payload: { id: number; dto: UpdateEmployeePayload },
	): Promise<EmployeeDto> {
		return this.employeesService.update(payload.id, payload.dto);
	}

	@MessagePattern(EMPLOYEES_CMD.REMOVE)
	remove(@Payload() payload: { id: number }): Promise<EmployeeDto> {
		return this.employeesService.remove(payload.id);
	}

	@MessagePattern(EMPLOYEES_CMD.FIND_BY_IDS)
	findByIds(@Payload() payload: FindByIdsPayload): Promise<EmployeeDto[]> {
		return this.employeesService.findByIds(payload.ids);
	}

	@MessagePattern(EMPLOYEES_CMD.GET_ACTIVE_STATUS)
	getActiveStatus(
		@Payload() payload: { id: number },
	): Promise<EmployeeActiveStatus | null> {
		return this.employeesService.getActiveStatus(payload.id);
	}
}
