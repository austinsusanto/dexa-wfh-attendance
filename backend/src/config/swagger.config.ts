import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Mounts interactive API docs at `/api/docs`.
 *
 * Operation paths already include the global prefix (/api/v1), so no server is
 * added (doing so would double the prefix in "Try it out").
 * `addBearerAuth` adds the Authorize button; `persistAuthorization` keeps the
 * pasted token across page reloads.
 */
export function setupSwagger(app: INestApplication): void {
	const config = new DocumentBuilder()
		.setTitle('Dexa WFH Attendance API')
		.setDescription('API absensi WFH & monitoring karyawan')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('api/docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	});
}
