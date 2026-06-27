import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Employee } from './entities/employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

/**
 * Employees domain module. Depends on UsersModule's service to provision the
 * linked login account, keeping the boundary clean for a future split.
 */
@Module({
	imports: [TypeOrmModule.forFeature([Employee]), UsersModule],
	controllers: [EmployeesController],
	providers: [EmployeesService],
	exports: [EmployeesService],
})
export class EmployeesModule {}
