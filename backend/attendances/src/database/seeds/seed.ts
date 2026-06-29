import { readFileSync } from 'fs';
import { join } from 'path';
import * as Minio from 'minio';
import { AttendanceType } from '@dexa/common/enums';
import { AppDataSource } from '../data-source';
import { Attendance } from '../../attendances/entities/attendance.entity';
import { toPublicPath } from '../../storage/storage.constants';

/**
 * Seeds attendances_db with sample punches for employees 1 & 2 over the last
 * 3 days, and uploads the committed sample photo to MinIO so the seeded rows
 * reference a real, servable object.
 *
 * References employee ids 1..4 created by the Employees service seeder — run
 * that one FIRST.
 */
const SAMPLE_FILENAME = 'seed-sample.jpg';
const SAMPLE_OBJECT = `attendances/${SAMPLE_FILENAME}`;
const SAMPLE_ASSET_SRC = join(__dirname, 'assets', SAMPLE_FILENAME);

function dateString(daysAgo: number): string {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	return date.toISOString().slice(0, 10);
}

function checkInAt(daysAgo: number): Date {
	const date = new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(8, 0, 0, 0);
	return date;
}

/** Uploads the committed sample photo to the bucket (idempotent). */
async function ensureSamplePhoto(): Promise<void> {
	const bucket = process.env.MINIO_BUCKET ?? 'attendance-photos';
	const client = new Minio.Client({
		endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
		port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
		useSSL: process.env.MINIO_USE_SSL === 'true',
		accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
		secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
	});

	const exists = await client.bucketExists(bucket).catch(() => false);
	if (!exists) {
		await client.makeBucket(bucket);
	}

	const buffer = readFileSync(SAMPLE_ASSET_SRC);
	await client.putObject(bucket, SAMPLE_OBJECT, buffer, buffer.length, {
		'Content-Type': 'image/jpeg',
	});
	console.log(`Uploaded sample photo to ${bucket}/${SAMPLE_OBJECT}`);
}

async function seed(): Promise<void> {
	await ensureSamplePhoto();

	const dataSource = await AppDataSource.initialize();

	try {
		const attendanceRepo = dataSource.getRepository(Attendance);

		// Idempotency guard: bail out if demo data already exists.
		const existing = await attendanceRepo.count();
		if (existing > 0) {
			console.log('attendances_db already seeded — skipping.');
			return;
		}

		const photoPath = toPublicPath(SAMPLE_OBJECT);
		const rows: Partial<Attendance>[] = [];
		for (const employeeId of [1, 2]) {
			for (const daysAgo of [3, 2, 1]) {
				rows.push({
					employeeId,
					attendanceDate: dateString(daysAgo),
					checkedInAt: checkInAt(daysAgo),
					photoPath,
					type: AttendanceType.CLOCK_IN,
					latitude: -6.2087634,
					longitude: 106.845599,
					notes: 'Seed sample attendance',
				});
			}
		}
		await attendanceRepo.save(attendanceRepo.create(rows));
		console.log(`Created ${rows.length} sample attendances`);
		console.log('Attendances seeding complete.');
	} finally {
		await dataSource.destroy();
	}
}

seed().catch((error) => {
	console.error('Attendances seeding failed:', error);
	process.exit(1);
});
