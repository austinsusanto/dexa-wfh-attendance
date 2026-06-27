import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/common/setup/configure-app';

/**
 * Boots the full application for e2e tests using the same global setup as
 * production (configureApp). Shared by every per-domain e2e suite so they all
 * behave identically. Requires the database to be running and seeded.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const app = moduleFixture.createNestApplication<App>();
	configureApp(app);
	await app.init();
	return app;
}
