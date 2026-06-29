import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

/**
 * Multer options for the attendance photo upload at the gateway. Uses memory
 * storage (not disk): the gateway holds the bytes only long enough to forward
 * them to the Attendances service, which owns object storage.
 */
export const attendanceUploadOptions: MulterOptions = {
	storage: memoryStorage(),
	fileFilter: (_req, file, cb) => {
		if (ALLOWED_MIME.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(
				new BadRequestException('Only JPG/PNG images are allowed'),
				false,
			);
		}
	},
	limits: { fileSize: MAX_FILE_SIZE },
};
