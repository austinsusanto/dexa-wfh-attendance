import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesClientModule } from '../clients/employees-client.module';
import { StorageModule } from '../storage/storage.module';
import { Attendance } from './entities/attendance.entity';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';

/**
 * Attendances domain module. Pulls in object storage (MinIO) for photos and the
 * Employees TCP client for monitoring enrichment.
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Attendance]),
		StorageModule,
		EmployeesClientModule,
	],
	controllers: [AttendancesController],
	providers: [AttendancesService],
	exports: [AttendancesService],
})
export class AttendancesModule {}
