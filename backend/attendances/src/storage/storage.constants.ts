import { extname } from 'path';

/**
 * Photo storage layout. Photos live in a MinIO bucket under the `attendances/`
 * prefix. The DB stores a `uploads/attendances/<file>` path so the existing
 * frontend can keep requesting photos from the gateway origin unchanged; the
 * gateway maps that path back to the bucket object.
 */
export const PHOTO_PREFIX = 'attendances';
export const PUBLIC_PATH_ROOT = 'uploads';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_MIME = ['image/jpeg', 'image/png'];

/** Builds a unique object name within the bucket for an employee's photo. */
export function buildObjectName(
	employeeId: number,
	originalName: string,
): string {
	const ext = extname(originalName) || '.jpg';
	const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
	return `${PHOTO_PREFIX}/att-emp${employeeId}-${unique}${ext}`;
}

/** Public path stored in the DB / returned to clients for a bucket object. */
export function toPublicPath(objectName: string): string {
	return `${PUBLIC_PATH_ROOT}/${objectName}`;
}
