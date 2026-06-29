import { Module } from '@nestjs/common';
import { GatewayStorageService } from './gateway-storage.service';

/**
 * Provides read-only object-storage access for serving attendance photos.
 * Mounted as a raw `/uploads` handler in main.ts (outside the /api/v1 prefix).
 */
@Module({
	providers: [GatewayStorageService],
	exports: [GatewayStorageService],
})
export class UploadsModule {}
