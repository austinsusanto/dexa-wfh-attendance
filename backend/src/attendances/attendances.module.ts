import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/config.types';
import { buildAttendanceMulterOptions } from './attendance-upload.config';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { Attendance } from './entities/attendance.entity';

/**
 * Attendances domain module. Configures Multer (photo upload) from the app's
 * UPLOAD_DIR so storage/limits live in one place.
 */
@Module({
	imports: [
		TypeOrmModule.forFeature([Attendance]),
		MulterModule.registerAsync({
			inject: [ConfigService],
			useFactory: (configService: ConfigService<AppConfig, true>) =>
				buildAttendanceMulterOptions(
					configService.get('uploadDir', { infer: true }),
				),
		}),
	],
	controllers: [AttendancesController],
	providers: [AttendancesService],
	exports: [AttendancesService],
})
export class AttendancesModule {}
