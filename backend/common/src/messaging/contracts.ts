import { UserRole } from '../enums/app.enum';
import { AttendanceType } from '../enums/attendance.enum';
import { AuthenticatedUser } from '../types/auth.types';
import { PaginatedResult } from '../types/pagination.types';

/**
 * Cross-service payload/result shapes for the TCP message patterns. These are
 * plain (JSON-serializable) interfaces — over the wire there are no class
 * instances, Date objects become ISO strings, etc. Keeping them here makes the
 * gateway↔service contract explicit and type-checked on both ends.
 */

/* ----------------------------- Identity ----------------------------------- */

export interface LoginPayload {
	email: string;
	password: string;
}

export interface LoginResult {
	accessToken: string;
	user: AuthenticatedUser;
}

export interface ValidateTokenPayload {
	userId: number;
}

export interface CreateUserPayload {
	email: string;
	password: string;
	employeeId: number;
}

export interface CreatedUserResult {
	id: number;
}

/* ----------------------------- Employees ---------------------------------- */

export interface EmployeeDto {
	id: number;
	employeeNumber: string;
	fullName: string;
	position: string;
	department: string;
	email: string;
	phone: string;
	isActive: boolean;
	createdAt: string | Date;
	updatedAt: string | Date;
}

export interface CreateEmployeePayload {
	employeeNumber: string;
	fullName: string;
	position: string;
	department: string;
	email: string;
	phone: string;
	initialPassword: string;
}

export interface UpdateEmployeePayload {
	employeeNumber?: string;
	fullName?: string;
	position?: string;
	department?: string;
	phone?: string;
}

export interface EmployeeQueryPayload {
	page: number;
	limit: number;
	search?: string;
}

export interface FindByIdsPayload {
	ids: number[];
}

export interface EmployeeActiveStatus {
	id: number;
	isActive: boolean;
}

export type EmployeesListResult = PaginatedResult<EmployeeDto>;

/* ---------------------------- Attendances --------------------------------- */

/** A photo upload forwarded from the gateway over TCP (base64-encoded bytes). */
export interface UploadedPhoto {
	originalName: string;
	mimeType: string;
	size: number;
	base64: string;
}

export interface CreateAttendancePayload {
	user: AuthenticatedUser;
	type?: AttendanceType;
	latitude?: number;
	longitude?: number;
	notes?: string;
	photo: UploadedPhoto;
}

/** Snapshot of employee fields the monitoring view embeds with an attendance. */
export interface AttendanceEmployeeSummary {
	id: number;
	employeeNumber: string;
	fullName: string;
	position: string;
	department: string;
	email: string;
	isActive: boolean;
}

export interface AttendanceDto {
	id: number;
	employeeId: number;
	attendanceDate: string;
	checkedInAt: string | Date;
	photoPath: string;
	type: AttendanceType;
	latitude: number | null;
	longitude: number | null;
	notes: string | null;
	createdAt: string | Date;
	employee?: AttendanceEmployeeSummary | null;
}

export interface MyAttendanceQueryPayload {
	employeeId: number;
	page: number;
	limit: number;
	from?: string;
	to?: string;
}

export interface AdminAttendanceQueryPayload {
	page: number;
	limit: number;
	employeeId?: number;
	date?: string;
	from?: string;
	to?: string;
	type?: AttendanceType;
}

export interface FindAttendancePayload {
	id: number;
	user: AuthenticatedUser;
}

export type AttendancesListResult = PaginatedResult<AttendanceDto>;
