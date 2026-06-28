import { useState } from 'react'
import type { ComponentType } from 'react'
import {
	CalendarClock,
	LogOut,
	Menu,
	Shield,
	Users,
	X,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../brand/BrandMark'
import { cn } from '../../lib/cn'
import { useAuth } from '../../hooks/use-auth'
import { displayNameFromEmail, initialsFromName } from '../../lib/user'

const NAV_ITEMS: {
	to: string
	label: string
	icon: ComponentType<{ className?: string }>
}[] = [
	{ to: '/admin/karyawan', label: 'Data Karyawan', icon: Users },
	{ to: '/admin/monitoring', label: 'Monitoring Absensi', icon: CalendarClock },
]

const TITLES: Record<string, string> = {
	'/admin/karyawan': 'Data Karyawan',
	'/admin/monitoring': 'Monitoring Absensi',
}

const navClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
		isActive
			? 'bg-primary-50 text-primary-700'
			: 'text-ink-muted hover:bg-canvas',
	)

/** Sidebar contents (logo, nav, user card) — shared by desktop + mobile drawer. */
function SidebarBody({
	name,
	onLogout,
	onNavigate,
}: {
	name: string
	onLogout: () => void
	onNavigate?: () => void
}) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-15 items-center border-b border-line/70 px-5">
				<BrandMark subtitle="HRD" />
			</div>
			<div className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
				Menu
			</div>
			<nav className="flex flex-col gap-1 px-3">
				{NAV_ITEMS.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						onClick={onNavigate}
						className={navClass}
					>
						<item.icon className="size-[18px]" />
						{item.label}
					</NavLink>
				))}
			</nav>
			<div className="mt-auto p-4">
				<div className="rounded-xl border border-line/70 bg-surface-2 p-3">
					<div className="text-[12.5px] font-semibold text-ink-strong">
						{name}
					</div>
					<div className="mb-2.5 text-[11.5px] text-ink-muted">Admin HRD</div>
					<button
						type="button"
						onClick={onLogout}
						className="flex h-8.5 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white text-[12.5px] font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger"
					>
						<LogOut className="size-3.5" />
						Keluar
					</button>
				</div>
			</div>
		</div>
	)
}

/** Sidebar shell for the HRD admin app (Karyawan / Monitoring). */
export function AdminLayout() {
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const [drawerOpen, setDrawerOpen] = useState(false)
	const name = user ? displayNameFromEmail(user.email) : ''
	const title = TITLES[location.pathname] ?? 'Admin HRD'

	function handleLogout() {
		setDrawerOpen(false)
		logout()
		navigate('/login', { replace: true })
	}

	return (
		<div className="flex min-h-svh">
			{/* Desktop sidebar */}
			<aside className="sticky top-0 hidden h-svh w-60 shrink-0 border-r border-line bg-surface md:block">
				<SidebarBody name={name} onLogout={handleLogout} />
			</aside>

			{/* Mobile drawer */}
			{drawerOpen && (
				<div className="fixed inset-0 z-40 md:hidden">
					<div
						className="absolute inset-0 bg-black/40"
						onClick={() => setDrawerOpen(false)}
					/>
					<aside className="absolute left-0 top-0 h-svh w-64 max-w-[80vw] bg-surface shadow-xl">
						<button
							type="button"
							onClick={() => setDrawerOpen(false)}
							aria-label="Tutup menu"
							className="absolute right-3 top-4 flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas"
						>
							<X className="size-5" />
						</button>
						<SidebarBody
							name={name}
							onLogout={handleLogout}
							onNavigate={() => setDrawerOpen(false)}
						/>
					</aside>
				</div>
			)}

			{/* Main column */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-15 flex h-15 items-center justify-between border-b border-line bg-surface px-4 sm:px-7">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setDrawerOpen(true)}
							aria-label="Buka menu"
							className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink md:hidden"
						>
							<Menu className="size-5" />
						</button>
						<h1 className="text-[17px] font-bold text-ink-strong">{title}</h1>
					</div>
					<div className="flex items-center gap-3">
						<span className="hidden items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1.5 text-xs font-semibold text-primary-700 sm:inline-flex">
							<Shield className="size-3" />
							Admin HRD
						</span>
						<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-[13px] font-bold text-primary-700">
							{initialsFromName(name)}
						</div>
					</div>
				</header>

				<main className="flex-1 p-4 sm:p-7">
					<Outlet />
				</main>
			</div>
		</div>
	)
}
