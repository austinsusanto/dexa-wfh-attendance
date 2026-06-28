import axios from 'axios'
import { env } from '../config/env'

const TOKEN_KEY = 'dexa_token'

export function getToken(): string | null {
	return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
	if (token) {
		localStorage.setItem(TOKEN_KEY, token)
	} else {
		localStorage.removeItem(TOKEN_KEY)
	}
}

// Handler invoked on a 401 so AuthContext can force a logout.
let onUnauthorized: (() => void) | null = null
export function setOnUnauthorized(handler: (() => void) | null): void {
	onUnauthorized = handler
}

export const api = axios.create({ baseURL: env.apiBaseUrl })

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
	const token = getToken()
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// On 401 the session is invalid/expired -> trigger auto-logout.
api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 && onUnauthorized) {
			onUnauthorized()
		}
		return Promise.reject(error)
	},
)

/** Extracts a human-readable message from an Axios error (API error envelope). */
export function getApiErrorMessage(error: unknown, fallback: string): string {
	if (axios.isAxiosError(error)) {
		const message = error.response?.data?.message
		if (typeof message === 'string') return message
		if (Array.isArray(message)) return message.join(', ')
	}
	return fallback
}
