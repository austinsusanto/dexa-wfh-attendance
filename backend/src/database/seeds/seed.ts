import * as bcrypt from 'bcrypt';
import { copyFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { AppDataSource } from '../data-source';
import { UserRole } from '../../common/enums/app.enum';
import { AttendanceType } from '../../attendances/enums/attendance.enum';
import { Attendance } from '../../attendances/entities/attendance.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { User } from '../../users/entities/user.entity';

const BCRYPT_ROUNDS = 10;
const ADMIN_EMAIL = 'admin@dexa.com';
const ADMIN_PASSWORD = 'Admin123';
const EMPLOYEE_PASSWORD = 'Employee123';

// Sample attendance photo: committed asset copied into the uploads folder so
// seeded rows reference a real, servable image.
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const SAMPLE_FILENAME = 'seed-sample.jpg';
const SAMPLE_PHOTO_PATH = `${UPLOAD_DIR}/attendances/${SAMPLE_FILENAME}`;
const SAMPLE_ASSET_SRC = join(__dirname, 'assets', SAMPLE_FILENAME);
const SAMPLE_PHOTO_DEST = join(process.cwd(), SAMPLE_PHOTO_PATH);

interface EmployeeSeed {
	employeeNumber: string;
	fullName: string;
	position: string;
	department: string;
	email: string;
	phone: string;
}

const EMPLOYEE_SEEDS: EmployeeSeed[] = [
	{
		employeeNumber: 'EMP001',
		fullName: 'Budi Santoso',
		position: 'Software Engineer',
		department: 'Engineering',
		email: 'budi@dexa.com',
		phone: '081200000001',
	},
	{
		employeeNumber: 'EMP002',
		fullName: 'Siti Aminah',
		position: 'QA Engineer',
		department: 'Engineering',
		email: 'siti@dexa.com',
		phone: '081200000002',
	},
	{
		employeeNumber: 'EMP003',
		fullName: 'Andi Wijaya',
		position: 'Product Manager',
		department: 'Product',
		email: 'andi@dexa.com',
		phone: '081200000003',
	},
	{
		employeeNumber: 'EMP004',
		fullName: 'Dewi Lestari',
		position: 'UI/UX Designer',
		department: 'Design',
		email: 'dewi@dexa.com',
		phone: '081200000004',
	},
];

/**
 * Returns the date `daysAgo` days before today, formatted as YYYY-MM-DD.
 */
function dateString(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString().slice(0, 10);
}

/**
 * Builds a server-side check-in timestamp at 08:00 local time, `daysAgo` days back.
 */
function checkInAt(daysAgo: number): Date {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(8, 0, 0, 0);
	return date;
}

/**
 * Copies the committed sample photo into the uploads folder. Runs on every seed
 * (even when data already exists) so the served image is always present.
 */
function ensureSampleAsset(): void {
	mkdirSync(dirname(SAMPLE_PHOTO_DEST), { recursive: true });
	copyFileSync(SAMPLE_ASSET_SRC, SAMPLE_PHOTO_DEST);
	console.log(`Ensured sample photo at ${SAMPLE_PHOTO_PATH}`);
}

async function seed(): Promise<void> {
	ensureSampleAsset();

	const dataSource = await AppDataSource.initialize();

	try {
		const userRepo = dataSource.getRepository(User);
		const employeeRepo = dataSource.getRepository(Employee);
		const attendanceRepo = dataSource.getRepository(Attendance);

		// Idempotency guard: bail out if demo data already exists.
		const existingAdmin = await userRepo.findOne({
			where: { email: ADMIN_EMAIL },
		});
		if (existingAdmin) {
			console.log('Database already seeded — skipping.');
			return;
		}

		// 1) HRD admin account (no linked employee).
		const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
		await userRepo.save(
			userRepo.create({
				email: ADMIN_EMAIL,
				password: adminPasswordHash,
				role: UserRole.HRD_ADMIN,
				employeeId: null,
			}),
		);
		console.log(`Created HRD admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

		// 2) Employees + their EMPLOYEE login accounts.
		const employeePasswordHash = await bcrypt.hash(
			EMPLOYEE_PASSWORD,
			BCRYPT_ROUNDS,
		);
		const savedEmployees: Employee[] = [];
		for (const seedData of EMPLOYEE_SEEDS) {
			const employee = await employeeRepo.save(
				employeeRepo.create({ ...seedData, isActive: true }),
			);
			await userRepo.save(
				userRepo.create({
					email: seedData.email,
					password: employeePasswordHash,
					role: UserRole.EMPLOYEE,
					employeeId: employee.id,
				}),
			);
			savedEmployees.push(employee);
		}
		console.log(
			`Created ${savedEmployees.length} employees (password: ${EMPLOYEE_PASSWORD})`,
		);

		// 3) Sample attendances for the first two employees over the last 3 days.
		const attendances: Partial<Attendance>[] = [];
		for (const employee of savedEmployees.slice(0, 2)) {
			for (const daysAgo of [3, 2, 1]) {
				attendances.push({
					employeeId: employee.id,
					attendanceDate: dateString(daysAgo),
					checkedInAt: checkInAt(daysAgo),
					photoPath: SAMPLE_PHOTO_PATH,
					type: AttendanceType.CLOCK_IN,
					latitude: -6.2087634,
					longitude: 106.845599,
					notes: 'Seed sample attendance',
				});
			}
		}
		await attendanceRepo.save(attendanceRepo.create(attendances));
		console.log(`Created ${attendances.length} sample attendances`);

		console.log('Seeding complete.');
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error) => {
	console.error('Seeding failed:', error);
	process.exit(1);
});
