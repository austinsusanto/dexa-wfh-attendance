import { api } from './client'
import type { ApiResponse } from '../types/api.types'
import type { AuthUser, LoginResponse } from '../types/auth.types'

export async function login(
	email: string,
	password: string,
): Promise<LoginResponse> {
	const res = await api.post<ApiResponse<LoginResponse>>('/auth/login', {
		email,
		password,
	})
	return res.data.data
}

export async function getMe(): Promise<AuthUser> {
	const res = await api.get<ApiResponse<AuthUser>>('/auth/me')
	return res.data.data
}
