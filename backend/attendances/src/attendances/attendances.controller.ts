import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ATTENDANCES_CMD } from '@dexa/common/messaging';
import type {
	AdminAttendanceQueryPayload,
	AttendanceDto,
	CreateAttendancePayload,
	FindAttendancePayload,
	MyAttendanceQueryPayload,
} from '@dexa/common/messaging';
import type { PaginatedResult } from '@dexa/common/types';
import { AttendancesService } from './attendances.service';

/**
 * TCP message-pattern handlers for the attendances domain. The HTTP layer
 * (multipart upload, role guards) lives in the gateway; this service is
 * transport-only and owns the photo storage + double-punch rules.
 */
@Controller()
export class AttendancesController {
	constructor(private readonly attendancesService: AttendancesService) {}

	@MessagePattern(ATTENDANCES_CMD.CREATE)
	create(
		@Payload() payload: CreateAttendancePayload,
	): Promise<AttendanceDto> {
		return this.attendancesService.create(payload);
	}

	@MessagePattern(ATTENDANCES_CMD.FIND_MINE)
	findMine(
		@Payload() payload: MyAttendanceQueryPayload,
	): Promise<PaginatedResult<AttendanceDto>> {
		return this.attendancesService.findMine(payload);
	}

	@MessagePattern(ATTENDANCES_CMD.FIND_ALL_FOR_ADMIN)
	findAllForAdmin(
		@Payload() payload: AdminAttendanceQueryPayload,
	): Promise<PaginatedResult<AttendanceDto>> {
		return this.attendancesService.findAllForAdmin(payload);
	}

	@MessagePattern(ATTENDANCES_CMD.FIND_ONE)
	findOne(@Payload() payload: FindAttendancePayload): Promise<AttendanceDto> {
		return this.attendancesService.findOne(payload.id, payload.user);
	}
}
