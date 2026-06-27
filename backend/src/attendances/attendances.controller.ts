import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/app.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../common/types/auth.types';
import { AttendancesService } from './attendances.service';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { MyAttendanceQueryDto } from './dto/my-attendance-query.dto';

@ApiTags('attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendancesController {
	constructor(private readonly attendancesService: AttendancesService) {}

	@Post()
	@Roles(UserRole.EMPLOYEE)
	@UseInterceptors(FileInterceptor('photo'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			required: ['photo'],
			properties: {
				photo: { type: 'string', format: 'binary' },
				type: { type: 'string', enum: ['CLOCK_IN', 'CLOCK_OUT'] },
				latitude: { type: 'number' },
				longitude: { type: 'number' },
				notes: { type: 'string' },
			},
		},
	})
	@ApiOperation({ summary: 'Submit a WFH attendance with a photo (employee)' })
	@ResponseMessage('Attendance submitted')
	create(
		@CurrentUser() user: AuthenticatedUser,
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: CreateAttendanceDto,
	) {
		return this.attendancesService.create(user, file, dto);
	}

	// Must stay above @Get(':id') — otherwise "me" matches the :id route
	// and ParseIntPipe rejects it. Static routes go before dynamic ones.
	@Get('me')
	@Roles(UserRole.EMPLOYEE)
	@ApiOperation({ summary: 'List my own attendance history (employee)' })
	@ResponseMessage('Attendance history retrieved')
	findMine(
		@CurrentUser() user: AuthenticatedUser,
		@Query() query: MyAttendanceQueryDto,
	) {
		return this.attendancesService.findMine(user.employeeId as number, query);
	}

	@Get()
	@Roles(UserRole.HRD_ADMIN)
	@ApiOperation({ summary: 'Monitor all attendances, view-only (HRD)' })
	@ResponseMessage('Attendances retrieved')
	findAll(@Query() query: AttendanceQueryDto) {
		return this.attendancesService.findAllForAdmin(query);
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get one attendance (HRD, or the owning employee)' })
	@ResponseMessage('Attendance retrieved')
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: AuthenticatedUser,
	) {
		return this.attendancesService.findOne(id, user);
	}
}
