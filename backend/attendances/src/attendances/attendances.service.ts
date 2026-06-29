import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceType, UserRole } from '@dexa/common/enums';
import {
	AdminAttendanceQueryPayload,
	AttendanceDto,
	AttendanceEmployeeSummary,
	CLIENT_TOKEN,
	CreateAttendancePayload,
	EMPLOYEES_CMD,
	EmployeeDto,
	MyAttendanceQueryPayload,
	rpcBadRequest,
	rpcConflict,
	rpcForbidden,
	rpcNotFound,
	sendRpc,
} from '@dexa/common/messaging';
import { AuthenticatedUser, PaginatedResult } from '@dexa/common/types';
import {
	buildPaginatedResult,
	getSkip,
	toDateString,
} from '@dexa/common/utils';
import { Attendance } from './entities/attendance.entity';
import { StorageService } from '../storage/storage.service';
import {
	ALLOWED_MIME,
	MAX_FILE_SIZE,
	buildObjectName,
	toPublicPath,
} from '../storage/storage.constants';

@Injectable()
export class AttendancesService {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepo: Repository<Attendance>,
		private readonly storage: StorageService,
		@Inject(CLIENT_TOKEN.EMPLOYEES)
		private readonly employeesClient: ClientProxy,
	) {}

	/**
	 * Records a WFH attendance punch. The photo arrives base64-encoded from the
	 * gateway; the server sets the timestamp/date, rejects a double punch of the
	 * same type on the same day (409), and only then uploads to object storage.
	 */
	async create(payload: CreateAttendancePayload): Promise<AttendanceDto> {
		const { user, photo } = payload;

		if (!photo || !photo.base64) {
			rpcBadRequest('Attendance photo is required');
		}
		if (!ALLOWED_MIME.includes(photo.mimeType)) {
			rpcBadRequest('Only JPG/PNG images are allowed');
		}

		// Only an employee with a linked record can clock in.
		if (!user.employeeId) {
			rpcForbidden('Only employees can submit attendance');
		}

		const buffer = Buffer.from(photo.base64, 'base64');
		if (buffer.length > MAX_FILE_SIZE) {
			rpcBadRequest('Photo exceeds the 5MB size limit');
		}

		const type = payload.type ?? AttendanceType.CLOCK_IN;
		const attendanceDate = toDateString(new Date());

		const alreadyPunched = await this.attendanceRepo.existsBy({
			employeeId: user.employeeId,
			attendanceDate,
			type,
		});
		if (alreadyPunched) {
			rpcConflict(`Already submitted a ${type} for today`);
		}

		const objectName = buildObjectName(user.employeeId, photo.originalName);
		await this.storage.put(objectName, buffer, photo.mimeType);

		try {
			const attendance = this.attendanceRepo.create({
				employeeId: user.employeeId,
				attendanceDate,
				checkedInAt: new Date(), // server clock, not the client's
				photoPath: toPublicPath(objectName),
				type,
				latitude: payload.latitude ?? null,
				longitude: payload.longitude ?? null,
				notes: payload.notes ?? null,
			});
			const saved = await this.attendanceRepo.save(attendance);
			return saved;
		} catch (error) {
			// Persist failed (e.g. unique-index race): drop the orphaned object.
			await this.storage.remove(objectName);
			throw error;
		}
	}

	/** An employee's own attendance history (paginated, optional date range). */
	async findMine(
		query: MyAttendanceQueryPayload,
	): Promise<PaginatedResult<AttendanceDto>> {
		const { employeeId, page, limit, from, to } = query;
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

	/** HRD monitoring: all attendances enriched with employee info, filterable. */
	async findAllForAdmin(
		query: AdminAttendanceQueryPayload,
	): Promise<PaginatedResult<AttendanceDto>> {
		const { page, limit, employeeId, date, from, to, type } = query;
		const qb = this.attendanceRepo.createQueryBuilder('attendance');

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

		const enriched = await this.attachEmployees(items);
		return buildPaginatedResult(enriched, total, page, limit);
	}

	/** Detail view. HRD sees any; an employee only sees their own (else 403). */
	async findOne(id: number, user: AuthenticatedUser): Promise<AttendanceDto> {
		const attendance = await this.attendanceRepo.findOne({ where: { id } });
		if (!attendance) {
			rpcNotFound('Attendance not found');
		}

		if (
			user.role === UserRole.EMPLOYEE &&
			attendance.employeeId !== user.employeeId
		) {
			rpcForbidden('You can only view your own attendance');
		}

		const [enriched] = await this.attachEmployees([attendance]);
		return enriched;
	}

	/**
	 * Fetches the referenced employees from the Employees service in one call and
	 * embeds a summary in each attendance (the monitoring view needs name/NIK,
	 * which this service does not store).
	 */
	private async attachEmployees(
		items: Attendance[],
	): Promise<AttendanceDto[]> {
		const ids = [...new Set(items.map((item) => item.employeeId))];
		if (ids.length === 0) {
			return [];
		}

		const employees = await sendRpc<EmployeeDto[]>(
			this.employeesClient,
			EMPLOYEES_CMD.FIND_BY_IDS,
			{ ids },
		);
		const byId = new Map<number, AttendanceEmployeeSummary>(
			employees.map((employee) => [
				employee.id,
				{
					id: employee.id,
					employeeNumber: employee.employeeNumber,
					fullName: employee.fullName,
					position: employee.position,
					department: employee.department,
					email: employee.email,
					isActive: employee.isActive,
				},
			]),
		);

		return items.map((item) => ({
			...item,
			employee: byId.get(item.employeeId) ?? null,
		}));
	}
}
