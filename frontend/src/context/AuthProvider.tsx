import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import * as authService from '../api/auth.service'
import { getToken, setOnUnauthorized, setToken } from '../api/client'
import type { AuthStatus, AuthUser } from '../types/auth.types'

/**
 * Holds auth state (user + token) and exposes login/logout. Restores the
 * session from a stored token on mount and auto-logs-out on any 401.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null)
	const [status, setStatus] = useState<AuthStatus>('loading')

	const logout = useCallback(() => {
		setToken(null)
		setUser(null)
		setStatus('unauthenticated')
	}, [])

	// Let the API client trigger logout on a 401.
	useEffect(() => {
		setOnUnauthorized(logout)
		return () => setOnUnauthorized(null)
	}, [logout])

	// Restore session from a previously stored token.
	useEffect(() => {
		if (!getToken()) {
			setStatus('unauthenticated')
			return
		}
		authService
			.getMe()
			.then((restored) => {
				setUser(restored)
				setStatus('authenticated')
			})
			.catch(() => {
				setToken(null)
				setStatus('unauthenticated')
			})
	}, [])

	const login = useCallback(async (email: string, password: string) => {
		const result = await authService.login(email, password)
		setToken(result.accessToken)
		setUser(result.user)
		setStatus('authenticated')
		return result.user
	}, [])

	const value = useMemo(
		() => ({ user, status, login, logout }),
		[user, status, login, logout],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
