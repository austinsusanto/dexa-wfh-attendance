import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';

/**
 * Master data karyawan (employees_db). Soft-deleted via `isActive` so attendance
 * history stays intact.
 *
 * The login account (Identity service) and attendance records (Attendances
 * service) live in other services and reference this row by id — there are no
 * DB-level relations here anymore.
 */
@Entity('employees')
export class Employee {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({
		name: 'employee_number',
		type: 'varchar',
		length: 30,
		unique: true,
	})
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
}
