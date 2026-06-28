export type UserRole = 'EMPLOYEE' | 'HRD_ADMIN'

/** Authenticated user as returned by /auth/login and /auth/me. */
export interface AuthUser {
	id: number
	email: string
	role: UserRole
	employeeId: number | null
}

export interface LoginResponse {
	accessToken: string
	user: AuthUser
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface AuthContextValue {
	user: AuthUser | null
	status: AuthStatus
	login: (email: string, password: string) => Promise<AuthUser>
	logout: () => void
}
