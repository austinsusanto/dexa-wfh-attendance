import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from '../utils/create-test-app';

/**
 * E2E suite for the auth domain. Lives under test/auth/ so it travels with the
 * auth module when it is extracted into its own microservice (PLAN §2).
 * Requires the database seeded (npm run seed).
 */
describe('Auth (e2e)', () => {
	let app: INestApplication<App>;

	// Boot the full app once before all tests in this suite.
	beforeAll(async () => {
		app = await createTestApp();
	});

	// Shut the app (and its DB connection) down after the suite.
	afterAll(async () => {
		await app.close();
	});

	it('POST /auth/login returns a token for valid credentials', () => {
		return request(app.getHttpServer())
			.post('/api/v1/auth/login') // hit the login endpoint
			.send({ email: 'admin@dexa.com', password: 'Admin123' }) // valid seeded admin
			.expect(200) // login succeeds
			.expect((res) => {
				// envelope says success
				expect(res.body.success).toBe(true);
				// a JWT string is returned
				expect(typeof res.body.data.accessToken).toBe('string');
				// the returned user carries the admin role
				expect(res.body.data.user.role).toBe('HRD_ADMIN');
			});
	});

	it('POST /auth/login rejects wrong password with 401', () => {
		return request(app.getHttpServer())
			.post('/api/v1/auth/login') // hit the login endpoint
			.send({ email: 'admin@dexa.com', password: 'wrong-password' }) // bad password
			.expect(401) // unauthorized
			.expect((res) => {
				// error envelope
				expect(res.body.success).toBe(false);
			});
	});

	it('POST /auth/login rejects an invalid body with 400', () => {
		return request(app.getHttpServer())
			.post('/api/v1/auth/login') // hit the login endpoint
			.send({ email: 'not-an-email' }) // fails validation (bad email, no password)
			.expect(400); // bad request from ValidationPipe
	});

	it('GET /auth/me without a token is rejected with 401', () => {
		return request(app.getHttpServer())
			.get('/api/v1/auth/me') // protected endpoint, no Authorization header
			.expect(401); // JwtAuthGuard blocks it
	});

	it('GET /auth/me returns the profile when authenticated', async () => {
		// First log in to obtain a token.
		const login = await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({ email: 'budi@dexa.com', password: 'Employee123' });
		const token = login.body.data.accessToken as string;

		return request(app.getHttpServer())
			.get('/api/v1/auth/me') // call the protected endpoint
			.set('Authorization', `Bearer ${token}`) // with the bearer token
			.expect(200) // allowed through
			.expect((res) => {
				// the profile matches the logged-in employee
				expect(res.body.data.email).toBe('budi@dexa.com');
				expect(res.body.data.role).toBe('EMPLOYEE');
			});
	});
});
