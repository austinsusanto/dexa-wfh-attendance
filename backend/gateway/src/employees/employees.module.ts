import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';

/**
 * Employees HTTP routes. The Employees TCP client and guards come from the
 * global ClientsModule / SecurityModule.
 */
@Module({
	controllers: [EmployeesController],
})
export class EmployeesModule {}
