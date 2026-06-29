import { Module } from '@nestjs/common';
import { AttendancesController } from './attendances.controller';

/**
 * Attendances HTTP routes (multipart upload + queries). The Attendances TCP
 * client and guards come from the global ClientsModule / SecurityModule.
 */
@Module({
	controllers: [AttendancesController],
})
export class AttendancesModule {}
