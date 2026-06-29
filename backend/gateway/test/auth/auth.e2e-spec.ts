import { INestApplication, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { of, throwError } from 'rxjs';
import { agent } from 'supertest';
import { UserRole } from '@dexa/common/enums';
import { IDENTITY_CMD } from '@dexa/common/messaging';
import {
	createTestApp,
	MockClient,
	TestContext,
} from '../utils/create-test-app';

describe('Gateway auth + RBAC (e2e)', () => {
	let app: INestApplication;
	let identity: MockClient;
	let employees: MockClient;
	let jwt: JwtService;

	const employeePrincipal = {
		id: 2,
		email: 'budi@dexa.com',
		role: UserRole.EMPLOYEE,
		employeeId: 5,
	};
	const hrdPrincipal = {
		id: 1,
		email: 'admin@dexa.com',
		role: UserRole.HRD_ADMIN,
		employeeId: null,
	};

	beforeAll(async () => {
		const ctx: TestContext = await createTestApp();
		app = ctx.app;
		identity = ctx.identity;
		employees = ctx.employees;
		jwt = ctx.jwt;
	});

	afterAll(async () => {
		await app.close();
	});

	/** Signs a token the gateway's JwtAuthGuard will accept (shared secret). */
	function tokenFor(sub: number): string {
		return jwt.sign({ sub, email: 'x@dexa.com', role: UserRole.EMPLOYEE });
	}

	describe('POST /api/v1/auth/login', () => {
		it('returns a token wrapped in the success envelope', async () => {
			identity.send.mockReturnValue(
				of({ accessToken: 'signed.jwt', user: hrdPrincipal }),
			);

			const res = await agent(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'admin@dexa.com', password: 'Admin123' });

			expect(res.status).toBe(HttpStatus.OK);
			expect(res.body).toMatchObject({
				success: true,
				message: 'Login successful',
				data: { accessToken: 'signed.jwt' },
			});
			expect(identity.send).toHaveBeenCalledWith(IDENTITY_CMD.LOGIN, {
				email: 'admin@dexa.com',
				password: 'Admin123',
			});
		});

		it('rejects an invalid body with 400 (validation)', async () => {
			const res = await agent(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'not-an-email' });

			expect(res.status).toBe(HttpStatus.BAD_REQUEST);
			expect(res.body.success).toBe(false);
		});

		it('translates a downstream 401 RpcError into a 401 envelope', async () => {
			identity.send.mockReturnValue(
				throwError(() => ({
					statusCode: HttpStatus.UNAUTHORIZED,
					message: 'Invalid email or password',
				})),
			);

			const res = await agent(app.getHttpServer())
				.post('/api/v1/auth/login')
				.send({ email: 'admin@dexa.com', password: 'wrong' });

			expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
			expect(res.body).toMatchObject({
				success: false,
				message: 'Invalid email or password',
			});
		});
	});

	describe('GET /api/v1/auth/me', () => {
		it('returns 401 without a Bearer token', async () => {
			const res = await agent(app.getHttpServer()).get('/api/v1/auth/me');
			expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
		});

		it('returns the validated user when authenticated', async () => {
			identity.send.mockReturnValue(of(employeePrincipal)); // VALIDATE_TOKEN

			const res = await agent(app.getHttpServer())
				.get('/api/v1/auth/me')
				.set('Authorization', `Bearer ${tokenFor(2)}`);

			expect(res.status).toBe(HttpStatus.OK);
			expect(res.body.data).toMatchObject({ email: 'budi@dexa.com' });
		});
	});

	describe('RBAC on GET /api/v1/employees', () => {
		it('forbids an EMPLOYEE with 403', async () => {
			identity.send.mockReturnValue(of(employeePrincipal)); // VALIDATE_TOKEN

			const res = await agent(app.getHttpServer())
				.get('/api/v1/employees')
				.set('Authorization', `Bearer ${tokenFor(2)}`);

			expect(res.status).toBe(HttpStatus.FORBIDDEN);
			expect(employees.send).not.toHaveBeenCalled();
		});

		it('allows an HRD admin and forwards to the Employees service', async () => {
			identity.send.mockReturnValue(of(hrdPrincipal)); // VALIDATE_TOKEN
			employees.send.mockReturnValue(
				of({
					items: [],
					meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
				}),
			);

			const res = await agent(app.getHttpServer())
				.get('/api/v1/employees')
				.set('Authorization', `Bearer ${tokenFor(1)}`);

			expect(res.status).toBe(HttpStatus.OK);
			expect(res.body).toMatchObject({
				success: true,
				data: { items: [], meta: { total: 0 } },
			});
		});
	});
});
