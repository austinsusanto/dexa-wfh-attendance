import {
	Column,
	CreateDateColumn,
	Entity,
	JoinColumn,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../common/enums/app.enum';
import { Employee } from '../../employees/entities/employee.entity';

/**
 * Login account. Holds credentials and role for authentication/authorization.
 * Owns the 1:1 relation to Employee via the nullable `employee_id` FK.
 * HRD admin may have no linked employee.
 */
@Entity('users')
export class User {
	@PrimaryGeneratedColumn()
	id: number;

	@Column({ type: 'varchar', length: 150, unique: true })
	email: string;

	// Excluded from query results by default; auth opts in via addSelect.
	@Column({ type: 'varchar', length: 255, select: false })
	password: string;

	@Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
	role: UserRole;

	@Column({ name: 'employee_id', type: 'int', nullable: true })
	employeeId: number | null;

	@OneToOne(() => Employee, (employee) => employee.user, {
		nullable: true,
		onDelete: 'SET NULL',
	})
	@JoinColumn({ name: 'employee_id' })
	employee: Employee | null;

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}