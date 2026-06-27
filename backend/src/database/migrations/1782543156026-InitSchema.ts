import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1782543156026 implements MigrationInterface {
    name = 'InitSchema1782543156026'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(150) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('EMPLOYEE', 'HRD_ADMIN') NOT NULL DEFAULT 'EMPLOYEE', \`employee_id\` int NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`REL_9760615d88ed518196bb79ea03\` (\`employee_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`employees\` (\`id\` int NOT NULL AUTO_INCREMENT, \`employee_number\` varchar(30) NOT NULL, \`full_name\` varchar(150) NOT NULL, \`position\` varchar(100) NOT NULL, \`department\` varchar(100) NOT NULL, \`email\` varchar(150) NOT NULL, \`phone\` varchar(20) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_8878710dc844ecd6f9e587f34f\` (\`employee_number\`), UNIQUE INDEX \`IDX_765bc1ac8967533a04c74a9f6a\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`attendances\` (\`id\` int NOT NULL AUTO_INCREMENT, \`employee_id\` int NOT NULL, \`attendance_date\` date NOT NULL, \`checked_in_at\` timestamp NOT NULL, \`photo_path\` varchar(255) NOT NULL, \`type\` enum ('CLOCK_IN', 'CLOCK_OUT') NOT NULL DEFAULT 'CLOCK_IN', \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`notes\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`uq_attendance_emp_date_type\` (\`employee_id\`, \`attendance_date\`, \`type\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_9760615d88ed518196bb79ea03d\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`attendances\` ADD CONSTRAINT \`FK_43dca8b4751d7449a38b583991c\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`attendances\` DROP FOREIGN KEY \`FK_43dca8b4751d7449a38b583991c\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_9760615d88ed518196bb79ea03d\``);
        await queryRunner.query(`DROP INDEX \`uq_attendance_emp_date_type\` ON \`attendances\``);
        await queryRunner.query(`DROP TABLE \`attendances\``);
        await queryRunner.query(`DROP INDEX \`IDX_765bc1ac8967533a04c74a9f6a\` ON \`employees\``);
        await queryRunner.query(`DROP INDEX \`IDX_8878710dc844ecd6f9e587f34f\` ON \`employees\``);
        await queryRunner.query(`DROP TABLE \`employees\``);
        await queryRunner.query(`DROP INDEX \`REL_9760615d88ed518196bb79ea03\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
