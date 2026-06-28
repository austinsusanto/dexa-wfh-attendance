import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/use-auth'
import { homePathForRole } from './routes/paths'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { FullPageLoader } from './components/FullPageLoader'
import { LoginPage } from './pages/auth/LoginPage'
import { HowItWorksPage } from './pages/showcase/HowItWorksPage'
import { TechPage } from './pages/showcase/TechPage'
import { AbsenPage } from './pages/employee/AbsenPage'
import { RiwayatPage } from './pages/employee/RiwayatPage'
import { KaryawanPage } from './pages/hrd/KaryawanPage'
import { MonitoringPage } from './pages/hrd/MonitoringPage'
import { NotFoundPage } from './pages/NotFoundPage'

/** Sends `/` to login or the role's home depending on auth state. */
function RootRedirect() {
	const { user, status } = useAuth()
	if (status === 'loading') return <FullPageLoader />
	if (!user) return <Navigate to="/login" replace />
	return <Navigate to={homePathForRole(user.role)} replace />
}

export default function App() {
	return (
		<Routes>
			{/* Public */}
			<Route path="/login" element={<LoginPage />} />
			<Route path="/cara-kerja" element={<HowItWorksPage />} />
			<Route path="/teknologi" element={<TechPage />} />

			{/* Employee */}
			<Route
				path="/absen"
				element={
					<ProtectedRoute roles={['EMPLOYEE']}>
						<AbsenPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/riwayat"
				element={
					<ProtectedRoute roles={['EMPLOYEE']}>
						<RiwayatPage />
					</ProtectedRoute>
				}
			/>

			{/* HRD admin */}
			<Route
				path="/admin/karyawan"
				element={
					<ProtectedRoute roles={['HRD_ADMIN']}>
						<KaryawanPage />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/admin/monitoring"
				element={
					<ProtectedRoute roles={['HRD_ADMIN']}>
						<MonitoringPage />
					</ProtectedRoute>
				}
			/>

			{/* Root + fallback */}
			<Route path="/" element={<RootRedirect />} />
			<Route path="*" element={<NotFoundPage />} />
		</Routes>
	)
}
