import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { UserRole } from '../common/enums/app.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeQueryDto } from './dto/employee-query.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

/**
 * Master data karyawan — HRD only. Class-level guards enforce auth + role for
 * every route (PLAN §6.2, §6.4).
 */
@ApiTags('employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.HRD_ADMIN)
@Controller('employees')
export class EmployeesController {
	constructor(private readonly employeesService: EmployeesService) {}

	@Get()
	@ApiOperation({ summary: 'List employees (pagination + search)' })
	@ResponseMessage('Employees retrieved')
	findAll(@Query() query: EmployeeQueryDto) {
		return this.employeesService.findAll(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get one employee by id' })
	@ResponseMessage('Employee retrieved')
	findOne(@Param('id', ParseIntPipe) id: number) {
		return this.employeesService.findOne(id);
	}

	@Post()
	@ApiOperation({ summary: 'Create an employee and its login account' })
	@ResponseMessage('Employee created')
	create(@Body() dto: CreateEmployeeDto) {
		return this.employeesService.create(dto);
	}

	@Put(':id')
	@ApiOperation({ summary: 'Update an employee' })
	@ResponseMessage('Employee updated')
	update(
		@Param('id', ParseIntPipe) id: number,
		@Body() dto: UpdateEmployeeDto,
	) {
		return this.employeesService.update(id, dto);
	}

	@Delete(':id')
	@ApiOperation({ summary: 'Soft-delete an employee (is_active=false)' })
	@ResponseMessage('Employee deactivated')
	remove(@Param('id', ParseIntPipe) id: number) {
		return this.employeesService.remove(id);
	}
}
