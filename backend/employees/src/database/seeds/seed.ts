import { AppDataSource } from '../data-source';
import { Employee } from '../../employees/entities/employee.entity';

/**
 * Seeds employees_db with the demo karyawan. Inserted in order on a fresh DB so
 * their auto-increment ids are 1..4 — the Identity and Attendances seeders
 * reference those ids.
 */
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

async function seed(): Promise<void> {
	const dataSource = await AppDataSource.initialize();

	try {
		const employeeRepo = dataSource.getRepository(Employee);

		// Idempotency guard: bail out if demo data already exists.
		const existing = await employeeRepo.findOne({
			where: { employeeNumber: 'EMP001' },
		});
		if (existing) {
			console.log('employees_db already seeded — skipping.');
			return;
		}

		for (const seedData of EMPLOYEE_SEEDS) {
			await employeeRepo.save(
				employeeRepo.create({ ...seedData, isActive: true }),
			);
		}
		console.log(`Created ${EMPLOYEE_SEEDS.length} employees`);
		console.log('Employees seeding complete.');
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error) => {
	console.error('Employees seeding failed:', error);
	process.exit(1);
});
