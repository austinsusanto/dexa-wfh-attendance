import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

/**
 * Users domain module. Registers the User repository and exports UsersService
 * so other modules (e.g. auth) depend on the service interface, not the repo.
 */
@Module({
	imports: [TypeOrmModule.forFeature([User])],
	providers: [UsersService],
	exports: [UsersService],
})
export class UsersModule {}