import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Identity schema (identity_db): the `users` table only. `employee_id` is a
 * plain nullable reference to the Employees service — no DB-level FK, since the
 * employees table lives in another service's schema (PLAN §10.2).
 */
export class InitIdentitySchema1790000000001 implements MigrationInterface {
	name = 'InitIdentitySchema1790000000001';

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(
			`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('EMPLOYEE', 'HRD_ADMIN') NOT NULL DEFAULT 'EMPLOYEE', \`employee_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_users_email\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX \`IDX_users_email\` ON \`users\``);
		await queryRunner.query(`DROP TABLE \`users\``);
	}
}
