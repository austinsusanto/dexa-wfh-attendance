import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Query,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClientProxy } from '@nestjs/microservices';
import {
	ApiBearerAuth,
	ApiBody,
	ApiConsumes,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@dexa/common/enums';
import {
	ATTENDANCES_CMD,
	AttendanceDto,
	AttendancesListResult,
	CLIENT_TOKEN,
	sendRpc,
} from '@dexa/common/messaging';
import {
	CurrentUser,
	ResponseMessage,
	Roles,
	RolesGuard,
} from '@dexa/common/http';
import type { AuthenticatedUser } from '@dexa/common/types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { attendanceUploadOptions } from './attendance-upload.config';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { MyAttendanceQueryDto } from './dto/my-attendance-query.dto';

@ApiTags('attendances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendances')
export class AttendancesController {
	constructor(
		@Inject(CLIENT_TOKEN.ATTENDANCES)
		private readonly attendancesClient: ClientProxy,
	) {}

	@Post()
	@Roles(UserRole.EMPLOYEE)
	@UseInterceptors(FileInterceptor('photo', attendanceUploadOptions))
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
	@ApiOperation({
		summary: 'Submit a WFH attendance with a photo (employee)',
	})
	@ResponseMessage('Attendance submitted')
	create(
		@CurrentUser() user: AuthenticatedUser,
		@UploadedFile() file: Express.Multer.File | undefined,
		@Body() dto: CreateAttendanceDto,
	): Promise<AttendanceDto> {
		if (!file) {
			throw new BadRequestException('Attendance photo is required');
		}

		return sendRpc(this.attendancesClient, ATTENDANCES_CMD.CREATE, {
			user,
			type: dto.type,
			latitude: dto.latitude,
			longitude: dto.longitude,
			notes: dto.notes,
			photo: {
				originalName: file.originalname,
				mimeType: file.mimetype,
				size: file.size,
				base64: file.buffer.toString('base64'),
			},
		});
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
	): Promise<AttendancesListResult> {
		return sendRpc(this.attendancesClient, ATTENDANCES_CMD.FIND_MINE, {
			employeeId: user.employeeId,
			page: query.page,
			limit: query.limit,
			from: query.from,
			to: query.to,
		});
	}

	@Get()
	@Roles(UserRole.HRD_ADMIN)
	@ApiOperation({ summary: 'Monitor all attendances, view-only (HRD)' })
	@ResponseMessage('Attendances retrieved')
	findAll(
		@Query() query: AttendanceQueryDto,
	): Promise<AttendancesListResult> {
		return sendRpc(
			this.attendancesClient,
			ATTENDANCES_CMD.FIND_ALL_FOR_ADMIN,
			query,
		);
	}

	@Get(':id')
	@ApiOperation({
		summary: 'Get one attendance (HRD, or the owning employee)',
	})
	@ResponseMessage('Attendance retrieved')
	findOne(
		@Param('id', ParseIntPipe) id: number,
		@CurrentUser() user: AuthenticatedUser,
	): Promise<AttendanceDto> {
		return sendRpc(this.attendancesClient, ATTENDANCES_CMD.FIND_ONE, {
			id,
			user,
		});
	}
}
