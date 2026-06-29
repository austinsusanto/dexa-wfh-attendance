import * as bcrypt from 'bcrypt';
import { UserRole } from '@dexa/common/enums';
import { AppDataSource } from '../data-source';
import { User } from '../../users/entities/user.entity';

/**
 * Seeds the identity_db: 1 HRD admin + login accounts for the demo employees.
 *
 * `employeeId` values (1..4) match the auto-increment ids produced by the
 * Employees service seeder on a fresh DB — run the employees seed FIRST, then
 * this one.
 */
const BCRYPT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@dexa.com';
const ADMIN_PASSWORD = 'Admin123';
const EMPLOYEE_PASSWORD = 'Employee123';

interface UserSeed {
	email: string;
	employeeId: number;
}

// email → employeeId, mirroring the Employees service seed order.
const EMPLOYEE_USER_SEEDS: UserSeed[] = [
	{ email: 'budi@dexa.com', employeeId: 1 },
	{ email: 'siti@dexa.com', employeeId: 2 },
	{ email: 'andi@dexa.com', employeeId: 3 },
	{ email: 'dewi@dexa.com', employeeId: 4 },
];

async function seed(): Promise<void> {
	const dataSource = await AppDataSource.initialize();

	try {
		const userRepo = dataSource.getRepository(User);

		// Idempotency guard: bail out if demo data already exists.
		const existingAdmin = await userRepo.findOne({
			where: { email: ADMIN_EMAIL },
		});
		if (existingAdmin) {
			console.log('identity_db already seeded — skipping.');
			return;
		}

		// 1) HRD admin account (no linked employee).
		const adminPasswordHash = await bcrypt.hash(
			ADMIN_PASSWORD,
			BCRYPT_ROUNDS,
		);
		await userRepo.save(
			userRepo.create({
				email: ADMIN_EMAIL,
				password: adminPasswordHash,
				role: UserRole.HRD_ADMIN,
				employeeId: null,
			}),
		);
		console.log(`Created HRD admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

		// 2) EMPLOYEE login accounts.
		const employeePasswordHash = await bcrypt.hash(
			EMPLOYEE_PASSWORD,
			BCRYPT_ROUNDS,
		);
		for (const seedData of EMPLOYEE_USER_SEEDS) {
			await userRepo.save(
				userRepo.create({
					email: seedData.email,
					password: employeePasswordHash,
					role: UserRole.EMPLOYEE,
					employeeId: seedData.employeeId,
				}),
			);
		}
		console.log(
			`Created ${EMPLOYEE_USER_SEEDS.length} employee accounts (password: ${EMPLOYEE_PASSWORD})`,
		);

		console.log('Identity seeding complete.');
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error) => {
	console.error('Identity seeding failed:', error);
	process.exit(1);
});
