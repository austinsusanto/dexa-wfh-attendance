import { api } from './client'
import type { ApiResponse, Paginated } from '../types/api.types'
import type {
	Attendance,
	AttendanceQuery,
	CreateAttendanceInput,
	MyAttendanceQuery,
} from '../types/attendance.types'

export async function createAttendance(
	input: CreateAttendanceInput,
): Promise<Attendance> {
	const form = new FormData()
	form.append('photo', input.photo)
	if (input.type) form.append('type', input.type)
	if (input.latitude !== undefined) {
		form.append('latitude', String(input.latitude))
	}
	if (input.longitude !== undefined) {
		form.append('longitude', String(input.longitude))
	}
	if (input.notes) form.append('notes', input.notes)

	const res = await api.post<ApiResponse<Attendance>>('/attendances', form)
	return res.data.data
}

export async function listMyAttendances(
	query: MyAttendanceQuery = {},
): Promise<Paginated<Attendance>> {
	const res = await api.get<ApiResponse<Paginated<Attendance>>>(
		'/attendances/me',
		{ params: query },
	)
	return res.data.data
}

export async function listAllAttendances(
	query: AttendanceQuery = {},
): Promise<Paginated<Attendance>> {
	const res = await api.get<ApiResponse<Paginated<Attendance>>>(
		'/attendances',
		{ params: query },
	)
	return res.data.data
}

export async function getAttendance(id: number): Promise<Attendance> {
	const res = await api.get<ApiResponse<Attendance>>(`/attendances/${id}`)
	return res.data.data
}
