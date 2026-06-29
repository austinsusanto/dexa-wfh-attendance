import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@dexa/common/enums';

/**
 * Login account. Holds credentials and role for authentication/authorization.
 *
 * `employeeId` is a cross-service reference: the Employee record
 * lives in the Employees service, so there is NO DB-level FK/relation here —
 * just the id. HRD admin may have no linked employee (null).
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

	@CreateDateColumn({ name: 'created_at' })
	createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	updatedAt: Date;
}
