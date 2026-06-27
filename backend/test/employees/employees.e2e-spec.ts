import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from '../utils/create-test-app';

/**
 * E2E suite for the employees domain (HRD only). Lives under test/employees/ so
 * it travels with the module on extraction (PLAN §2). Requires the DB seeded.
 */
describe('Employees (e2e)', () => {
	let app: INestApplication<App>;
	let adminToken: string;
	let employeeToken: string;

	// Unique identifiers so the test never collides with seed/demo data.
	const newEmployee = {
		employeeNumber: 'EMP-E2E-1',
		fullName: 'E2E Tester',
		position: 'Engineer',
		department: 'Engineering',
		email: 'e2e.tester@dexa.com',
		phone: '081200009999',
		initialPassword: 'Employee123',
	};

	// Logs in and returns the access token.
	const login = async (email: string, password: string): Promise<string> => {
		const res = await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({ email, password });
		return res.body.data.accessToken;
	};

	beforeAll(async () => {
		app = await createTestApp();
		adminToken = await login('admin@dexa.com', 'Admin123');
		employeeToken = await login('budi@dexa.com', 'Employee123');
	});

	afterAll(async () => {
		// Remove the rows this suite created so the DB returns to seed state.
		const dataSource = app.get(DataSource);
		await dataSource.query('DELETE FROM users WHERE email = ?', [
			newEmployee.email,
		]);
		await dataSource.query('DELETE FROM employees WHERE employee_number = ?', [
			newEmployee.employeeNumber,
		]);
		await app.close();
	});

	it('GET /employees returns a paginated list for an admin', () => {
		return request(app.getHttpServer())
			.get('/api/v1/employees?page=1&limit=2')
			.set('Authorization', `Bearer ${adminToken}`)
			.expect(200)
			.expect((res) => {
				expect(Array.isArray(res.body.data.items)).toBe(true);
				expect(res.body.data.meta.limit).toBe(2);
			});
	});

	it('GET /employees is forbidden for an employee (403)', () => {
		return request(app.getHttpServer())
			.get('/api/v1/employees')
			.set('Authorization', `Bearer ${employeeToken}`)
			.expect(403);
	});

	it('GET /employees without a token is rejected (401)', () => {
		return request(app.getHttpServer()).get('/api/v1/employees').expect(401);
	});

	it('POST /employees creates an employee whose account can log in', async () => {
		// Create the employee as admin.
		const created = await request(app.getHttpServer())
			.post('/api/v1/employees')
			.set('Authorization', `Bearer ${adminToken}`)
			.send(newEmployee)
			.expect(201);
		expect(created.body.data.employeeNumber).toBe(newEmployee.employeeNumber);

		// The provisioned login account works and has the EMPLOYEE role.
		const loginRes = await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({ email: newEmployee.email, password: newEmployee.initialPassword })
			.expect(200);
		expect(loginRes.body.data.user.role).toBe('EMPLOYEE');
	});

	it('POST /employees rejects a duplicate employee number (409)', () => {
		return request(app.getHttpServer())
			.post('/api/v1/employees')
			.set('Authorization', `Bearer ${adminToken}`)
			.send(newEmployee)
			.expect(409);
	});
});
