import { Link } from 'react-router-dom'

export function NotFoundPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
			<p className="text-5xl font-extrabold text-primary">404</p>
			<h1 className="text-xl font-bold text-ink-strong">
				Halaman tidak ditemukan
			</h1>
			<Link
				to="/"
				className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary-700"
			>
				Kembali ke beranda
			</Link>
		</div>
	)
}
