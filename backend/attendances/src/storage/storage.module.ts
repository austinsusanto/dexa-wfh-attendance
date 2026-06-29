import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Object-storage module (MinIO). Exported so the attendances domain can persist
 * and remove photos without knowing the storage backend details.
 */
@Module({
	providers: [StorageService],
	exports: [StorageService],
})
export class StorageModule {}
