import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as Minio from 'minio';
import { AppConfig } from '../config/config.types';

/**
 * Read-only MinIO access for serving attendance photos. The gateway streams
 * objects at `GET /uploads/<object>` (outside the /api/v1 prefix) so the
 * existing frontend photo URLs keep working against a single public origin.
 */
@Injectable()
export class GatewayStorageService {
	private readonly logger = new Logger(GatewayStorageService.name);
	private readonly client: Minio.Client;
	private readonly bucket: string;

	constructor(configService: ConfigService<AppConfig, true>) {
		const cfg = configService.get('minio', { infer: true });
		this.bucket = cfg.bucket;
		this.client = new Minio.Client({
			endPoint: cfg.endPoint,
			port: cfg.port,
			useSSL: cfg.useSSL,
			accessKey: cfg.accessKey,
			secretKey: cfg.secretKey,
		});
	}

	/** Streams the object at `objectPath` (relative to /uploads) to the response. */
	async stream(objectPath: string, res: Response): Promise<void> {
		const objectName = objectPath.replace(/^\/+/, '');
		if (!objectName) {
			res.status(404).json({
				success: false,
				message: 'Photo not found',
			});
			return;
		}

		try {
			const stat = await this.client.statObject(this.bucket, objectName);
			res.setHeader(
				'Content-Type',
				stat.metaData?.['content-type'] ?? 'application/octet-stream',
			);
			res.setHeader('Cache-Control', 'public, max-age=3600');
			const stream = await this.client.getObject(this.bucket, objectName);
			stream.on('error', () => {
				if (!res.headersSent) {
					res.status(500).end();
				}
			});
			stream.pipe(res);
		} catch {
			res.status(404).json({
				success: false,
				message: 'Photo not found',
			});
		}
	}
}
