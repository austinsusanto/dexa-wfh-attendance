import { api } from './client'
import type { ApiResponse, Paginated } from '../types/api.types'
import type {
	CreateEmployeeInput,
	Employee,
	EmployeeQuery,
	UpdateEmployeeInput,
} from '../types/employee.types'

export async function listEmployees(
	query: EmployeeQuery = {},
): Promise<Paginated<Employee>> {
	const res = await api.get<ApiResponse<Paginated<Employee>>>('/employees', {
		params: query,
	})
	return res.data.data
}

export async function getEmployee(id: number): Promise<Employee> {
	const res = await api.get<ApiResponse<Employee>>(`/employees/${id}`)
	return res.data.data
}

export async function createEmployee(
	input: CreateEmployeeInput,
): Promise<Employee> {
	const res = await api.post<ApiResponse<Employee>>('/employees', input)
	return res.data.data
}

export async function updateEmployee(
	id: number,
	input: UpdateEmployeeInput,
): Promise<Employee> {
	const res = await api.put<ApiResponse<Employee>>(`/employees/${id}`, input)
	return res.data.data
}

export async function deactivateEmployee(id: number): Promise<Employee> {
	const res = await api.delete<ApiResponse<Employee>>(`/employees/${id}`)
	return res.data.data
}
