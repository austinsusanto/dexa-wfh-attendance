import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { homePathForRole } from './paths'
import { FullPageLoader } from '../components/FullPageLoader'
import type { UserRole } from '../types/auth.types'

interface ProtectedRouteProps {
	children: ReactNode
	/** When set, only these roles may enter; others go to their own home. */
	roles?: UserRole[]
}

/** Gates a route by authentication and (optionally) role. */
export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
	const { user, status } = useAuth()

	if (status === 'loading') {
		return <FullPageLoader />
	}
	if (!user) {
		return <Navigate to="/login" replace />
	}
	if (roles && !roles.includes(user.role)) {
		return <Navigate to={homePathForRole(user.role)} replace />
	}
	return <>{children}</>
}
