import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * Query params for GET /employees: pagination (inherited) + free-text search.
 * `search` matches across name, number, email, position, department.
 */
export class EmployeeQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ example: 'budi' })
	@IsOptional()
	@IsString()
	search?: string;
}
