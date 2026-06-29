/**
 * Minimal env the gateway's config validation requires to boot. The gateway has
 * no DB; TCP clients are overridden with mocks, so only JWT + MinIO vars matter.
 * Set at module load — before AppModule's ConfigModule validates env at compile.
 */
export const TEST_JWT_SECRET = 'test_secret_for_e2e';
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.MINIO_ENDPOINT = 'localhost';
process.env.MINIO_PORT = '9000';
process.env.MINIO_ACCESS_KEY = 'minioadmin';
process.env.MINIO_SECRET_KEY = 'minioadmin';

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { configureApp } from '@dexa/common/http';
import { CLIENT_TOKEN } from '@dexa/common/messaging';
import { AppModule } from '../../src/app.module';

/** A stub `ClientProxy.send` whose return value tests control per pattern. */
export type MockClient = { send: jest.Mock };

export interface TestContext {
	app: INestApplication;
	identity: MockClient;
	employees: MockClient;
	attendances: MockClient;
	jwt: JwtService;
}

/**
 * Boots the real gateway AppModule with the three downstream TCP clients
 * replaced by Jest mocks, and the shared HTTP setup applied (prefix, validation,
 * envelope) — exactly as production via configureApp. Lets e2e tests exercise
 * routing, guards, RBAC and the response envelope without any live service.
 */
export async function createTestApp(): Promise<TestContext> {
	const identity: MockClient = { send: jest.fn() };
	const employees: MockClient = { send: jest.fn() };
	const attendances: MockClient = { send: jest.fn() };

	const moduleRef = await Test.createTestingModule({
		imports: [AppModule],
	})
		.overrideProvider(CLIENT_TOKEN.IDENTITY)
		.useValue(identity as unknown as ClientProxy)
		.overrideProvider(CLIENT_TOKEN.EMPLOYEES)
		.useValue(employees as unknown as ClientProxy)
		.overrideProvider(CLIENT_TOKEN.ATTENDANCES)
		.useValue(attendances as unknown as ClientProxy)
		.compile();

	const app = moduleRef.createNestApplication();
	configureApp(app);
	await app.init();

	return { app, identity, employees, attendances, jwt: app.get(JwtService) };
}
