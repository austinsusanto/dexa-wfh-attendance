/**
 * Application-wide enums shared across modules.
 * Module-specific enums live in that module's own `*.enum.ts` file.
 */

/**
 * Roles for role-based access control.
 * Mirrors the `users.role` ENUM column in the database.
 */
export enum UserRole {
	EMPLOYEE = 'EMPLOYEE',
	HRD_ADMIN = 'HRD_ADMIN',
}