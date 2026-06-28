import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useAuth } from '../../hooks/use-auth'
import { homePathForRole } from '../../routes/paths'
import { getApiErrorMessage } from '../../api/client'

const DEMO_ACCOUNTS = [
	{
		role: 'Admin HRD',
		email: 'admin@dexa.com',
		password: 'Admin123',
		roleClass: 'text-primary-700',
	},
	{
		role: 'Karyawan',
		email: 'budi@dexa.com',
		password: 'Employee123',
		roleClass: 'text-ink',
	},
]

export function LoginPage() {
	const { user, login } = useAuth()
	const navigate = useNavigate()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	// Already logged in → go straight to the role's home.
	if (user) {
		return <Navigate to={homePathForRole(user.role)} replace />
	}

	async function handleSubmit(event: FormEvent) {
		event.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const loggedIn = await login(email.trim(), password)
			navigate(homePathForRole(loggedIn.role), { replace: true })
		} catch (err) {
			setError(getApiErrorMessage(err, 'Email atau password salah'))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="grid min-h-svh grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
			{/* Brand panel (desktop only) */}
			<div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 p-14 lg:flex">
				<div className="pointer-events-none absolute -right-20 -top-20 size-[340px] rounded-full border border-white/10" />
				<div className="pointer-events-none absolute -bottom-32 right-10 size-[260px] rounded-full border border-white/10" />

				<div className="relative flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-[10px] bg-white text-xl font-extrabold text-primary">
						D
					</div>
					<span className="text-[17px] font-bold text-white">
						Dexa<span className="font-medium opacity-85"> · WFH Attendance</span>
					</span>
				</div>

				<div className="relative">
					<span className="mb-5 inline-block rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold tracking-wide text-white">
						ABSENSI WFH · MONITORING
					</span>
					<h1 className="m-0 mb-4 text-[38px] font-bold leading-tight tracking-tight text-white">
						Absensi dari rumah,
						<br />
						terpercaya &amp; terukur.
					</h1>
					<p className="m-0 max-w-[380px] text-[15px] leading-relaxed text-white/80">
						Karyawan absen dengan foto bukti WFH — waktu dicatat otomatis oleh
						server. HRD memantau seluruh tim dalam satu dasbor.
					</p>
					<div className="mt-8 flex gap-7">
						{[
							{ value: 'Foto', label: 'bukti WFH' },
							{ value: 'Server', label: 'cap waktu' },
							{ value: 'Role', label: 'akses aman' },
						].map((stat, index) => (
							<div key={stat.value} className="flex items-center gap-7">
								{index > 0 && <div className="h-8 w-px bg-white/20" />}
								<div>
									<div className="text-[22px] font-bold text-white">
										{stat.value}
									</div>
									<div className="text-[12.5px] text-white/70">
										{stat.label}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>

				<div className="relative text-[12.5px] text-white/60">
					© 2026 Dexa Group · Internal HR Tool
				</div>
			</div>

			{/* Form panel */}
			<div className="flex items-center justify-center px-7 py-10">
				<div className="w-full max-w-[380px]">
					<h2 className="m-0 mb-1.5 text-2xl font-bold text-ink-strong">
						Masuk ke akun Anda
					</h2>
					<p className="m-0 mb-7 text-sm text-ink-muted">
						Gunakan kredensial yang diberikan HRD.
					</p>

					{error && (
						<div className="mb-4 flex items-center gap-2.5 rounded-lg border border-primary-200 bg-danger-bg px-3.5 py-3 text-[13.5px] font-medium text-danger-text">
							<AlertCircle className="size-4 shrink-0" />
							<span>{error}</span>
						</div>
					)}

					<form onSubmit={handleSubmit} className="flex flex-col gap-4">
						<TextField
							id="email"
							label="Email"
							type="email"
							placeholder="nama@dexa.com"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							leftIcon={<Mail className="size-[17px]" />}
							required
						/>
						<TextField
							id="password"
							label="Password"
							type={showPassword ? 'text' : 'password'}
							placeholder="••••••••"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							leftIcon={<Lock className="size-[17px]" />}
							rightSlot={
								<button
									type="button"
									onClick={() => setShowPassword((v) => !v)}
									aria-label={
										showPassword ? 'Sembunyikan password' : 'Tampilkan password'
									}
									className="flex size-8 items-center justify-center rounded text-ink-muted hover:text-ink"
								>
									{showPassword ? (
										<EyeOff className="size-[18px]" />
									) : (
										<Eye className="size-[18px]" />
									)}
								</button>
							}
							required
						/>

						<Button type="submit" fullWidth loading={loading} className="mt-1">
							Masuk
						</Button>
					</form>

					{/* Demo accounts */}
					<div className="mt-5 rounded-[10px] border border-dashed border-line bg-surface-2 px-4 py-3.5">
						<div className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
							Akun demo — klik untuk isi
						</div>
						<div className="flex flex-col gap-2">
							{DEMO_ACCOUNTS.map((acc) => (
								<button
									key={acc.email}
									type="button"
									onClick={() => {
										setEmail(acc.email)
										setPassword(acc.password)
										setError(null)
									}}
									className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-primary-50"
								>
									<span className="text-[13px]">
										<b className={acc.roleClass}>{acc.role}</b> · {acc.email}
									</span>
									<span className="text-xs text-ink-muted">{acc.password}</span>
								</button>
							))}
						</div>
					</div>

					<div className="mt-6 flex justify-center gap-4 text-[13px] text-ink-muted">
						<Link to="/cara-kerja" className="hover:text-primary">
							Cara kerja
						</Link>
						<span className="text-line">·</span>
						<Link to="/teknologi" className="hover:text-primary">
							Teknologi
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
