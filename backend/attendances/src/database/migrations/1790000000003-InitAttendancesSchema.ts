import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Attendances schema (attendances_db): the `attendances` table only.
 * `employee_id` references the Employees service by id (no DB-level FK).
 * The unique index still guards against a double punch of the same type/day.
 */
export class InitAttendancesSchema1790000000003 implements MigrationInterface {
	name = 'InitAttendancesSchema1790000000003';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE \`attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`employee_id\` int NOT NULL, \`attendance_date\` date NOT NULL, \`checked_in_at\` timestamp NOT NULL, \`photo_path\` varchar(255) NOT NULL, \`type\` enum ('CLOCK_IN', 'CLOCK_OUT') NOT NULL DEFAULT 'CLOCK_IN', \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`notes\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`uq_attendance_emp_date_type\` (\`employee_id\`, \`attendance_date\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX \`uq_attendance_emp_date_type\` ON \`attendances\``,
		);
		await queryRunner.query(`DROP TABLE \`attendances\``);
	}
}
