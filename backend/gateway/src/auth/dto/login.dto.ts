import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * Login request body. Validated by the gateway's global ValidationPipe before
 * being forwarded to the Identity service.
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
