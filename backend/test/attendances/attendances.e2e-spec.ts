import { INestApplication } from '@nestjs/common';
import { unlink } from 'fs/promises';
import { join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../utils/create-test-app';

// 1x1 PNG used as the uploaded attendance photo.
const PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
	'base64',
);

/**
 * E2E suite for the attendances domain. Lives under test/attendances/ so it
 * travels with the module on extraction (PLAN §2). Requires the DB seeded.
 */
describe('Attendances (e2e)', () => {
	let app: INestApplication<App>;
	let employeeToken: string;
	let adminToken: string;

	// Helper: log in and return the access token.
	const login = async (email: string, password: string): Promise<string> => {
		const res = await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({ email, password });
		return res.body.data.accessToken;
	};

	// Boot the app once and grab an employee + admin token for the suite.
	beforeAll(async () => {
		app = await createTestApp();
		employeeToken = await login('budi@dexa.com', 'Employee123');
		adminToken = await login('admin@dexa.com', 'Admin123');
	});

	// Clean up: delete the rows + photo files this suite created
	// (seed rows use seed-sample.jpg, so the LIKE filter spares them).
	afterAll(async () => {
		const dataSource = app.get(DataSource);
		const rows: { photo_path: string }[] = await dataSource.query(
			"SELECT photo_path FROM attendances WHERE photo_path LIKE 'uploads/attendances/att-emp%'",
		);
		for (const row of rows) {
			await unlink(join(process.cwd(), row.photo_path)).catch(() => undefined);
		}
		await dataSource.query(
			"DELETE FROM attendances WHERE photo_path LIKE 'uploads/attendances/att-emp%'",
		);
		await app.close();
	});

	it('POST /attendances records a punch for an employee', async () => {
		// Employee uploads a photo (multipart) -> server creates the punch.
		const res = await request(app.getHttpServer())
			.post('/api/v1/attendances')
			.set('Authorization', `Bearer ${employeeToken}`)
			.attach('photo', PNG, { filename: 'photo.png', contentType: 'image/png' })
			.field('notes', 'WFH e2e')
			.expect(201);
		// Defaults to CLOCK_IN and the server stores a photo path.
		expect(res.body.data.type).toBe('CLOCK_IN');
		expect(res.body.data.photoPath).toContain('uploads/attendances/');
	});

	it('POST /attendances rejects a second CLOCK_IN the same day (409)', () => {
		// Same employee, same type, same day -> blocked by the unique rule.
		return request(app.getHttpServer())
			.post('/api/v1/attendances')
			.set('Authorization', `Bearer ${employeeToken}`)
			.attach('photo', PNG, { filename: 'photo.png', contentType: 'image/png' })
			.expect(409);
	});

	it('GET /attendances/me returns the employee history', () => {
		// Employee sees their own records (seeded + the one just created).
		return request(app.getHttpServer())
			.get('/api/v1/attendances/me?page=1&limit=5')
			.set('Authorization', `Bearer ${employeeToken}`)
			.expect(200)
			.expect((res) => {
				expect(Array.isArray(res.body.data.items)).toBe(true);
				expect(res.body.data.meta.total).toBeGreaterThan(0);
			});
	});

	it('GET /attendances (HRD monitoring) returns rows with employee info', () => {
		// Admin sees all attendances, joined with the employee record.
		return request(app.getHttpServer())
			.get('/api/v1/attendances?limit=3')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200)
			.expect((res) => {
				expect(res.body.data.items[0].employee).toBeDefined();
			});
	});

	it('POST /attendances is forbidden for an admin (403, view-only)', () => {
		// HRD has no clock-in right -> RolesGuard blocks it.
		return request(app.getHttpServer())
			.post('/api/v1/attendances')
			.set('Authorization', `Bearer ${adminToken}`)
			.attach('photo', PNG, { filename: 'photo.png', contentType: 'image/png' })
			.expect(403);
	});

	it('GET /attendances is forbidden for an employee (403)', () => {
		// The all-attendances monitoring list is HRD-only.
		return request(app.getHttpServer())
			.get('/api/v1/attendances')
			.set('Authorization', `Bearer ${employeeToken}`)
			.expect(403);
	});

	it('GET /attendances without a token is rejected (401)', () => {
		// No bearer token -> JwtAuthGuard blocks it.
		return request(app.getHttpServer())
			.get('/api/v1/attendances')
			.expect(401);
	});
});
