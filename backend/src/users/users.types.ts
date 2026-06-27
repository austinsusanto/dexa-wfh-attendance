/** Params for provisioning an EMPLOYEE login account from the employees flow. */
export interface CreateEmployeeUserParams {
	email: string;
	password: string;
	employeeId: number;
}
