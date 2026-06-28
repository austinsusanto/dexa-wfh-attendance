import { useState } from 'react'
import { Clock, LineChart, LogOut, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BrandMark } from '../brand/BrandMark'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/use-auth'
import { displayNameFromEmail, initialsFromName } from '../../lib/user'

const NAV_ITEMS = [
	{ to: '/absen', label: 'Absen', icon: Clock },
	{ to: '/riwayat', label: 'Riwayat', icon: LineChart },
]

const desktopNavClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
		isActive
			? 'bg-primary-50 text-primary-700'
			: 'text-ink-muted hover:bg-canvas',
	)

const drawerNavClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
		isActive
			? 'bg-primary-50 text-primary-700'
			: 'text-ink hover:bg-canvas',
	)

/** Top-bar shell for the employee app; collapses to a hamburger drawer on mobile. */
export function EmployeeLayout() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [menuOpen, setMenuOpen] = useState(false)
	const name = user ? displayNameFromEmail(user.email) : ''

	function handleLogout() {
		setMenuOpen(false)
		logout()
		navigate('/login', { replace: true })
	}

	return (
		<div className="flex min-h-svh flex-col">
			<header className="sticky top-0 z-20 flex h-15 items-center justify-between gap-3 border-b border-line bg-surface px-4 sm:px-6">
				<div className="flex items-center gap-7">
					<BrandMark />
					<nav className="hidden gap-1 md:flex">
						{NAV_ITEMS.map((item) => (
							<NavLink key={item.to} to={item.to} className={desktopNavClass}>
								<item.icon className="size-4" />
								{item.label}
							</NavLink>
						))}
					</nav>
				</div>

				{/* Desktop user + logout */}
				<div className="hidden items-center gap-3.5 md:flex">
					<div className="text-right leading-tight">
						<div className="text-[13.5px] font-semibold text-ink-strong">
							{name}
						</div>
						<div className="text-[11.5px] text-ink-muted">Karyawan</div>
					</div>
					<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[13px] font-bold text-primary-700">
						{initialsFromName(name)}
					</div>
					<button
						type="button"
						onClick={handleLogout}
						title="Keluar"
						className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors hover:border-danger hover:text-danger"
					>
						<LogOut className="size-[17px]" />
					</button>
				</div>

				{/* Mobile hamburger */}
				<button
					type="button"
					onClick={() => setMenuOpen(true)}
					aria-label="Buka menu"
					className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink md:hidden"
				>
					<Menu className="size-5" />
				</button>
			</header>

			{/* Mobile drawer */}
			{menuOpen && (
				<div className="fixed inset-0 z-40 md:hidden">
					<div
						className="absolute inset-0 bg-black/40"
						onClick={() => setMenuOpen(false)}
					/>
					<div className="absolute right-0 top-0 flex h-svh w-72 max-w-[80vw] flex-col bg-surface shadow-xl">
						<div className="flex items-center justify-between border-b border-line px-4 py-3.5">
							<div className="flex items-center gap-2.5">
								<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[13px] font-bold text-primary-700">
									{initialsFromName(name)}
								</div>
								<div className="leading-tight">
									<div className="text-sm font-semibold text-ink-strong">
										{name}
									</div>
									<div className="text-[11.5px] text-ink-muted">Karyawan</div>
								</div>
							</div>
							<button
								type="button"
								onClick={() => setMenuOpen(false)}
								aria-label="Tutup menu"
								className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas"
							>
								<X className="size-5" />
							</button>
						</div>

						<nav className="flex flex-1 flex-col gap-1 p-3">
							{NAV_ITEMS.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									onClick={() => setMenuOpen(false)}
									className={drawerNavClass}
								>
									<item.icon className="size-[18px]" />
									{item.label}
								</NavLink>
							))}
						</nav>

						<div className="border-t border-line p-3">
							<button
								type="button"
								onClick={handleLogout}
								className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-bg"
							>
								<LogOut className="size-[18px] shrink-0" />
								Keluar
							</button>
						</div>
					</div>
				</div>
			)}

			<main className="flex flex-1 justify-center px-4 pb-14 pt-8 sm:px-6">
				<Outlet />
			</main>
		</div>
	)
}
