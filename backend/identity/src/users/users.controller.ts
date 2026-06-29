import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { IDENTITY_CMD, rpcConflict } from '@dexa/common/messaging';
import type {
	CreatedUserResult,
	CreateUserPayload,
} from '@dexa/common/messaging';
import { UsersService } from './users.service';

/**
 * TCP message-pattern handlers for the users domain: account provisioning and
 * email-uniqueness checks used by the Employees create saga.
 */
@Controller()
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@MessagePattern(IDENTITY_CMD.EXISTS_BY_EMAIL)
	existsByEmail(@Payload() payload: { email: string }): Promise<boolean> {
		return this.usersService.existsByEmail(payload.email);
	}

	@MessagePattern(IDENTITY_CMD.CREATE_USER)
	async createUser(
		@Payload() payload: CreateUserPayload,
	): Promise<CreatedUserResult> {
		if (await this.usersService.existsByEmail(payload.email)) {
			rpcConflict('A user with this email already exists');
		}
		const user = await this.usersService.createEmployeeUser(payload);
		return { id: user.id };
	}
}
