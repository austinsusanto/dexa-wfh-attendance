import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityClientModule } from '../clients/identity-client.module';
import { Employee } from './entities/employee.entity';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';

/**
 * Employees domain module. Depends on the Identity TCP client to provision the
 * linked login account during the create saga.
 */
@Module({
	imports: [TypeOrmModule.forFeature([Employee]), IdentityClientModule],
	controllers: [EmployeesController],
	providers: [EmployeesService],
	exports: [EmployeesService],
})
export class EmployeesModule {}
