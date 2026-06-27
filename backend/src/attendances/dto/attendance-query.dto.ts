import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AttendanceType } from '../enums/attendance.enum';

/**
 * Query for GET /attendances (HRD monitoring): pagination + filters by employee,
 * exact date or date range, and type.
 */
export class AttendanceQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ example: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	employeeId?: number;

	@ApiPropertyOptional({ example: '2026-06-27' })
	@IsOptional()
	@IsDateString()
	date?: string;

	@ApiPropertyOptional({ example: '2026-06-01' })
	@IsOptional()
	@IsDateString()
	from?: string;

	@ApiPropertyOptional({ example: '2026-06-30' })
	@IsOptional()
	@IsDateString()
	to?: string;

	@ApiPropertyOptional({ enum: AttendanceType })
	@IsOptional()
	@IsEnum(AttendanceType)
	type?: AttendanceType;
}
