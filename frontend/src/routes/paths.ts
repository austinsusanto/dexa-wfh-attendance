import type { UserRole } from '../types/auth.types'

/** Where a user lands after login / when hitting `/`. */
export function homePathForRole(role: UserRole): string {
	return role === 'HRD_ADMIN' ? '/admin/karyawan' : '/absen'
}
