import {
	BadRequestException,
	ConflictException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { Repository } from 'typeorm';
import { AppConfig } from '../config/config.types';
import { UserRole } from '../common/enums/app.enum';
import { AuthenticatedUser } from '../common/types/auth.types';
import { PaginatedResult } from '../common/types/pagination.types';
import {
	buildPaginatedResult,
	getSkip,
} from '../common/utils/pagination.util';
import { toDateString } from '../common/utils/date.util';
import { ATTENDANCE_SUBDIR } from './attendance-upload.config';
import { AttendanceQueryDto } from './dto/attendance-query.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { MyAttendanceQueryDto } from './dto/my-attendance-query.dto';
import { Attendance } from './entities/attendance.entity';
import { AttendanceType } from './enums/attendance.enum';

@Injectable()
export class AttendancesService {
	private readonly uploadDir: string;

	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepo: Repository<Attendance>,
		private readonly configService: ConfigService<AppConfig, true>,
	) {
		this.uploadDir = this.configService.get('uploadDir', { infer: true });
	}

	/**
	 * Records a WFH attendance punch. The photo is already saved to disk by
	 * Multer; the server sets the timestamp/date and rejects a double punch of
	 * the same type on the same day (409), deleting the orphaned file.
	 */
	async create(
		user: AuthenticatedUser,
		file: Express.Multer.File | undefined,
		dto: CreateAttendanceDto,
	): Promise<Attendance> {
		if (!file) {
			throw new BadRequestException('Attendance photo is required');
		}

		// Only an employee with a linked record can clock in.
		if (!user.employeeId) {
			await this.removeFile(file.path);
			throw new ForbiddenException('Only employees can submit attendance');
		}

		const type = dto.type ?? AttendanceType.CLOCK_IN;
		const attendanceDate = toDateString(new Date());

		const alreadyPunched = await this.attendanceRepo.existsBy({
			employeeId: user.employeeId,
			attendanceDate,
			type,
		});
		if (alreadyPunched) {
			await this.removeFile(file.path);
			throw new ConflictException(
				`Already submitted a ${type} for today`,
			);
		}

		const attendance = this.attendanceRepo.create({
			employeeId: user.employeeId,
			attendanceDate,
			checkedInAt: new Date(), // server clock, not the client's
			photoPath: `${this.uploadDir}/${ATTENDANCE_SUBDIR}/${file.filename}`,
			type,
			latitude: dto.latitude ?? null,
			longitude: dto.longitude ?? null,
			notes: dto.notes ?? null,
		});

		return this.attendanceRepo.save(attendance);
	}

	/** An employee's own attendance history (paginated, optional date range). */
	async findMine(
		employeeId: number,
		query: MyAttendanceQueryDto,
	): Promise<PaginatedResult<Attendance>> {
		const { page, limit, from, to } = query;
		const qb = this.attendanceRepo
			.createQueryBuilder('attendance')
			.where('attendance.employee_id = :employeeId', { employeeId });

		if (from) {
			qb.andWhere('attendance.attendance_date >= :from', { from });
		}
		if (to) {
			qb.andWhere('attendance.attendance_date <= :to', { to });
		}

		const [items, total] = await qb
			.orderBy('attendance.checked_in_at', 'DESC')
			.skip(getSkip(page, limit))
			.take(limit)
			.getManyAndCount();

		return buildPaginatedResult(items, total, page, limit);
	}

	/** HRD monitoring: all attendances with employee info, filterable. */
	async findAllForAdmin(
		query: AttendanceQueryDto,
	): Promise<PaginatedResult<Attendance>> {
		const { page, limit, employeeId, date, from, to, type } = query;
		const qb = this.attendanceRepo
			.createQueryBuilder('attendance')
			.leftJoinAndSelect('attendance.employee', 'employee');

		if (employeeId) {
			qb.andWhere('attendance.employee_id = :employeeId', { employeeId });
		}
		if (date) {
			qb.andWhere('attendance.attendance_date = :date', { date });
		}
		if (from) {
			qb.andWhere('attendance.attendance_date >= :from', { from });
		}
		if (to) {
			qb.andWhere('attendance.attendance_date <= :to', { to });
		}
		if (type) {
			qb.andWhere('attendance.type = :type', { type });
		}

		const [items, total] = await qb
			.orderBy('attendance.checked_in_at', 'DESC')
			.skip(getSkip(page, limit))
			.take(limit)
			.getManyAndCount();

		return buildPaginatedResult(items, total, page, limit);
	}

	/** Detail view. HRD sees any; an employee only sees their own (else 403). */
	async findOne(id: number, user: AuthenticatedUser): Promise<Attendance> {
		const attendance = await this.attendanceRepo.findOne({
			where: { id },
			relations: { employee: true },
		});
		if (!attendance) {
			throw new NotFoundException('Attendance not found');
		}

		if (
			user.role === UserRole.EMPLOYEE &&
			attendance.employeeId !== user.employeeId
		) {
			throw new ForbiddenException('You can only view your own attendance');
		}

		return attendance;
	}

	/** Best-effort delete of an orphaned upload; ignores missing files. */
	private async removeFile(path: string): Promise<void> {
		await unlink(path).catch(() => undefined);
	}
}
