import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login request body. Validated by the global ValidationPipe.
 */
export class LoginDto {
	@ApiProperty({ example: 'admin@dexa.com' })
	@IsEmail()
	email: string;

	@ApiProperty({ example: 'Admin123' })
	@IsString()
	@IsNotEmpty()
	password: string;
}
