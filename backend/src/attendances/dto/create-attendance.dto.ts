import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	MaxLength,
	Min,
} from 'class-validator';
import { AttendanceType } from '../enums/attendance.enum';

/**
 * Body fields for POST /attendances (multipart/form-data). The `photo` file is
 * handled by Multer, not validated here. `checked_in_at`/`attendance_date` are
 * set by the server, never sent by the client (PLAN §5, §11).
 */
export class CreateAttendanceDto {
	@ApiPropertyOptional({ enum: AttendanceType, default: AttendanceType.CLOCK_IN })
	@IsOptional()
	@IsEnum(AttendanceType)
	type?: AttendanceType;

	@ApiPropertyOptional({ example: -6.2087634 })
	@IsOptional()
	@Type(() => Number) // multipart values arrive as strings
	@IsNumber()
	@Min(-90)
	@Max(90)
	latitude?: number;

	@ApiPropertyOptional({ example: 106.845599 })
	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	@Min(-180)
	@Max(180)
	longitude?: number;

	@ApiPropertyOptional({ maxLength: 255 })
	@IsOptional()
	@IsString()
	@MaxLength(255)
	notes?: string;
}
