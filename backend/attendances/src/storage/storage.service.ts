import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { AppConfig } from '../config/config.types';

/**
 * Thin wrapper over the MinIO (S3-compatible) client. Keeps the attendances
 * service stateless: photos go to object storage instead of local disk, so the
 * service can scale horizontally.
 */
@Injectable()
export class StorageService implements OnModuleInit {
	private readonly logger = new Logger(StorageService.name);
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

	/** Creates the bucket on startup if it does not yet exist. */
	async onModuleInit(): Promise<void> {
		const exists = await this.client
			.bucketExists(this.bucket)
			.catch(() => false);
		if (!exists) {
			await this.client.makeBucket(this.bucket);
			this.logger.log(`Created MinIO bucket "${this.bucket}"`);
		}
	}

	/** Uploads a photo buffer under the given object name. */
	async put(
		objectName: string,
		buffer: Buffer,
		contentType: string,
	): Promise<void> {
		await this.client.putObject(
			this.bucket,
			objectName,
			buffer,
			buffer.length,
			{ 'Content-Type': contentType },
		);
	}

	/** Best-effort delete of an object; ignores missing objects. */
	async remove(objectName: string): Promise<void> {
		await this.client
			.removeObject(this.bucket, objectName)
			.catch(() => undefined);
	}
}
