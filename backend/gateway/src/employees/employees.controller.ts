import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@dexa/common/enums';
import {
	CLIENT_TOKEN,
	EMPLOYEES_CMD,
	EmployeeDto,
	EmployeesListResult,
	sendRpc,
} from '@dexa/common/messaging';
import { ResponseMessage, Roles, RolesGuard } from '@dexa/common/http';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

/**
 * Master data karyawan — HRD only. Class-level guards enforce auth + role for
 * every route; each handler forwards to the Employees service over TCP.
 */
@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HRD_ADMIN)
@Controller('employees')
export class EmployeesController {
	constructor(
		@Inject(CLIENT_TOKEN.EMPLOYEES)
		private readonly employeesClient: ClientProxy,
	) {}

	@Get()
	@ApiOperation({ summary: 'List employees (pagination + search)' })
	@ResponseMessage('Employees retrieved')
	findAll(@Query() query: EmployeeQueryDto): Promise<EmployeesListResult> {
		return sendRpc(this.employeesClient, EMPLOYEES_CMD.FIND_ALL, query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get one employee by id' })
	@ResponseMessage('Employee retrieved')
	findOne(@Param('id', ParseIntPipe) id: number): Promise<EmployeeDto> {
		return sendRpc(this.employeesClient, EMPLOYEES_CMD.FIND_ONE, { id });
	}

	@Post()
	@ApiOperation({ summary: 'Create an employee and its login account' })
	@ResponseMessage('Employee created')
	create(@Body() dto: CreateEmployeeDto): Promise<EmployeeDto> {
		return sendRpc(this.employeesClient, EMPLOYEES_CMD.CREATE, dto);
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update an employee' })
	@ResponseMessage('Employee updated')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateEmployeeDto,
	): Promise<EmployeeDto> {
		return sendRpc(this.employeesClient, EMPLOYEES_CMD.UPDATE, { id, dto });
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Soft-delete an employee (is_active=false)' })
	@ResponseMessage('Employee deactivated')
	remove(@Param('id', ParseIntPipe) id: number): Promise<EmployeeDto> {
		return sendRpc(this.employeesClient, EMPLOYEES_CMD.REMOVE, { id });
	}
}
