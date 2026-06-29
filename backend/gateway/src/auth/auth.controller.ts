import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Inject,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	CLIENT_TOKEN,
	IDENTITY_CMD,
	LoginResult,
	sendRpc,
} from '@dexa/common/messaging';
import { CurrentUser, ResponseMessage } from '@dexa/common/http';
import type { AuthenticatedUser } from '@dexa/common/types';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(
		@Inject(CLIENT_TOKEN.IDENTITY)
		private readonly identityClient: ClientProxy,
	) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Authenticate and receive a JWT access token' })
	@ResponseMessage('Login successful')
	login(@Body() dto: LoginDto): Promise<LoginResult> {
		return sendRpc(this.identityClient, IDENTITY_CMD.LOGIN, {
			email: dto.email,
			password: dto.password,
		});
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: 'Get the profile of the authenticated user' })
	@ResponseMessage('Current user profile')
	me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
		return user;
	}
}
