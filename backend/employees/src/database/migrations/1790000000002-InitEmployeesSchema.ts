import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Employees schema (employees_db): the `employees` table only. No cross-service
 * FKs — users/attendances reference these rows by id from other services.
 */
export class InitEmployeesSchema1790000000002 implements MigrationInterface {
	name = 'InitEmployeesSchema1790000000002';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE \`employees\` (\`id\` int NOT NULL AUTO_INCREMENT, \`employee_number\` varchar(30) NOT NULL, \`full_name\` varchar(150) NOT NULL, \`position\` varchar(100) NOT NULL, \`department\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(20) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_employees_number\` (\`employee_number\`), UNIQUE INDEX \`IDX_employees_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`DROP INDEX \`IDX_employees_email\` ON \`employees\``,
		);
		await queryRunner.query(
			`DROP INDEX \`IDX_employees_number\` ON \`employees\``,
		);
		await queryRunner.query(`DROP TABLE \`employees\``);
	}
}
