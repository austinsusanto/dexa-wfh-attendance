import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { Attendance } from '../../attendances/entities/attendance.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Master data karyawan. Soft-deleted via `isActive` so attendance history
 * stays intact.
 */
@Entity('employees')
export class Employee {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ name: 'employee_number', type: 'varchar', length: 30, unique: true })
	employeeNumber: string;

	@Column({ name: 'full_name', type: 'varchar', length: 150 })
	fullName: string;

	@Column({ type: 'varchar', length: 100 })
	position: string;

	@Column({ type: 'varchar', length: 100 })
	department: string;

	@Column({ type: 'varchar', length: 150, unique: true })
	email: string;

	@Column({ type: 'varchar', length: 20 })
	phone: string;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive: boolean;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;

	// The login account for this employee (1:1, inverse side).
	@OneToOne(() => User, (user) => user.employee)
	user?: User;

	// All attendance records submitted by this employee.
	@OneToMany(() => Attendance, (attendance) => attendance.employee)
	attendances?: Attendance[];
}