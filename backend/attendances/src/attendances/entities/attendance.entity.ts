import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { numericTransformer } from '@dexa/common/transformers';
import { AttendanceType } from '@dexa/common/enums';

/**
 * A WFH attendance punch (attendances_db). `checkedInAt` and `attendanceDate`
 * are always set by the server, never trusted from the client.
 *
 * `employeeId` is a cross-service reference — the Employee record
 * lives in the Employees service, so there is no DB-level FK/relation here.
 *
 * Unique index on (employee_id, attendance_date, type) prevents a double
 * clock-in (or clock-out) for the same employee on the same day.
 */
@Entity('attendances')
@Index(
	'uq_attendance_emp_date_type',
	['employeeId', 'attendanceDate', 'type'],
	{
		unique: true,
	},
)
export class Attendance {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: 'employee_id', type: 'int' })
	employeeId: number;

	@Column({ name: 'attendance_date', type: 'date' })
	attendanceDate: string;

	@Column({ name: 'checked_in_at', type: 'timestamp' })
	checkedInAt: Date;

	@Column({ name: 'photo_path', type: 'varchar', length: 255 })
	photoPath: string;

	@Column({
		type: 'enum',
		enum: AttendanceType,
		default: AttendanceType.CLOCK_IN,
	})
	type: AttendanceType;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 7,
		nullable: true,
		transformer: numericTransformer,
	})
	latitude: number | null;

	@Column({
		type: 'decimal',
		precision: 10,
		scale: 7,
		nullable: true,
		transformer: numericTransformer,
	})
	longitude: number | null;

	@Column({ type: 'varchar', length: 255, nullable: true })
	notes: string | null;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;
}
