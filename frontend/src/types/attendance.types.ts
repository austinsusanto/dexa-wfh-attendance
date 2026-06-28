import type { Employee } from './employee.types'

export type AttendanceType = 'CLOCK_IN' | 'CLOCK_OUT'

export interface Attendance {
	id: number
	employeeId: number
	attendanceDate: string
	checkedInAt: string
	photoPath: string
	type: AttendanceType
	latitude: number | null
	longitude: number | null
	notes: string | null
	createdAt: string
	/** Present in HRD monitoring responses (joined). */
	employee?: Employee
}

/** Fields for POST /attendances (multipart). `photo` is required. */
export interface CreateAttendanceInput {
	photo: File
	type?: AttendanceType
	latitude?: number
	longitude?: number
	notes?: string
}

export interface MyAttendanceQuery {
	from?: string
	to?: string
	page?: number
	limit?: number
}

export interface AttendanceQuery {
	employeeId?: number
	date?: string
	from?: string
	to?: string
	type?: AttendanceType
	page?: number
	limit?: number
}
