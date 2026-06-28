export interface Employee {
	id: number
	employeeNumber: string
	fullName: string
	position: string
	department: string
	email: string
	phone: string
	isActive: boolean
	createdAt: string
	updatedAt: string
}

/** Body for POST /employees (also provisions the login account). */
export interface CreateEmployeeInput {
	employeeNumber: string
	fullName: string
	position: string
	department: string
	email: string
	phone: string
	initialPassword: string
}

/** Body for PUT /employees/:id — email & password are not editable. */
export type UpdateEmployeeInput = Partial<
	Omit<CreateEmployeeInput, 'email' | 'initialPassword'>
>

export interface EmployeeQuery {
	search?: string
	page?: number
	limit?: number
}
