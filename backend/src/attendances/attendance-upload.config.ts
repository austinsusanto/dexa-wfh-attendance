import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { AuthenticatedUser } from '../common/types/auth.types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png'];

/** Sub-folder (relative to uploadDir) where attendance photos are stored. */
export const ATTENDANCE_SUBDIR = 'attendances';

/**
 * Builds Multer options for the attendance photo upload: disk storage under
 * `<uploadDir>/attendances`, unique filename per employee, jpg/png only, 5MB cap.
 * The target directory is created on startup if missing.
 */
export function buildAttendanceMulterOptions(uploadDir: string): MulterOptions {
	const destination = join(process.cwd(), uploadDir, ATTENDANCE_SUBDIR);
	if (!existsSync(destination)) {
		mkdirSync(destination, { recursive: true });
	}

	return {
		storage: diskStorage({
			destination,
			filename: (req: Request, file, cb) => {
				const user = req.user as AuthenticatedUser | undefined;
				const ext = extname(file.originalname) || '.jpg';
				const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
				cb(null, `att-emp${user?.employeeId ?? 'x'}-${unique}${ext}`);
			},
		}),
		fileFilter: (req, file, cb) => {
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
}
