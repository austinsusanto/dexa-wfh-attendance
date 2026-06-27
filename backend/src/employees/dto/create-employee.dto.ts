import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsNotEmpty,
	IsString,
	Length,
	MaxLength,
	MinLength,
} from 'class-validator';

/**
 * Body for creating an employee together with its EMPLOYEE login account.
 * `initialPassword` is used to provision that account (PLAN §6.2).
 */
export class CreateEmployeeDto {
	@ApiProperty({ example: 'EMP005' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(30)
	employeeNumber: string;

	@ApiProperty({ example: 'Rina Hartono' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(150)
	fullName: string;

	@ApiProperty({ example: 'Backend Engineer' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	position: string;

	@ApiProperty({ example: 'Engineering' })
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	department: string;

	@ApiProperty({ example: 'rina@dexa.com' })
	@IsEmail()
	@MaxLength(150)
	email: string;

	@ApiProperty({ example: '081200000005' })
	@IsString()
	@IsNotEmpty()
	@Length(6, 20)
	phone: string;

	@ApiProperty({ example: 'Employee123', minLength: 6 })
	@IsString()
	@MinLength(6)
	initialPassword: string;
}
