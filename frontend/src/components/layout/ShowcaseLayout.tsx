import { ArrowRight } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { cn } from '../../lib/cn'

const tabClass = ({ isActive }: { isActive: boolean }) =>
	cn(
		'rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
		isActive ? 'bg-primary-50 text-primary-700' : 'text-ink-muted hover:text-primary',
	)

/** Marketing shell for the public showcase pages (Cara Kerja / Teknologi). */
export function ShowcaseLayout() {
	return (
		<div className="min-h-svh bg-surface">
			<header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/60 bg-surface/90 px-5 backdrop-blur sm:px-7">
				<Link to="/cara-kerja" className="flex items-center gap-2.5">
					<div className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-primary text-[15px] font-extrabold text-white">
						D
					</div>
					<span className="text-[15px] font-bold text-ink-strong">
						Dexa <span className="text-primary">WFH Attendance</span>
					</span>
				</Link>
				<div className="flex items-center gap-2">
					<nav className="hidden items-center gap-1 sm:flex">
						<NavLink to="/cara-kerja" className={tabClass}>
							Cara Kerja
						</NavLink>
						<NavLink to="/teknologi" className={tabClass}>
							Teknologi
						</NavLink>
					</nav>
					<Link
						to="/login"
						className="ml-1.5 inline-flex h-9.5 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13.5px] font-semibold text-white hover:bg-primary-700"
					>
						Masuk
						<ArrowRight className="size-4" />
					</Link>
				</div>
			</header>

			<Outlet />

			<footer className="border-t border-line/60 px-7 py-7 text-center">
				<div className="mb-3 flex flex-wrap justify-center gap-5 text-[13.5px] text-ink-muted">
					<Link to="/cara-kerja" className="hover:text-primary">
						Cara Kerja
					</Link>
					<Link to="/teknologi" className="hover:text-primary">
						Teknologi
					</Link>
					<Link to="/login" className="hover:text-primary">
						Masuk
					</Link>
				</div>
				<div className="text-[12.5px] text-ink-muted">
					© 2026 Dexa Group · Internal HR Tool
				</div>
			</footer>
		</div>
	)
}
