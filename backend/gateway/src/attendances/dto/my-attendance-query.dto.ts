import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@dexa/common/dto';

/**
 * Query for GET /attendances/me: pagination (inherited) + date range filter on
 * attendance_date.
 */
export class MyAttendanceQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ example: '2026-06-01' })
	@IsOptional()
	@IsDateString()
	from?: string;

	@ApiPropertyOptional({ example: '2026-06-30' })
	@IsOptional()
	@IsDateString()
	to?: string;
}
