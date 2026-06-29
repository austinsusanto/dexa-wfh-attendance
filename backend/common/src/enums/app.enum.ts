/**
 * Application-wide enums shared across services.
 */

/**
 * Roles for role-based access control.
 * Mirrors the `users.role` ENUM column in the database.
 */
export enum UserRole {
	EMPLOYEE = 'EMPLOYEE',
	HRD_ADMIN = 'HRD_ADMIN',
}
