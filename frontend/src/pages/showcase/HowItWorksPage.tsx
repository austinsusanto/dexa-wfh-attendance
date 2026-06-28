import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import {
	Archive,
	ArrowRight,
	CalendarX2,
	Camera,
	Check,
	Clock,
	LineChart,
	Shield,
	User,
	Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatClock, formatDateLong } from '../../lib/datetime'

const EMPLOYEE_STEPS = [
	{ title: 'Login', desc: 'Masuk dengan akun yang dibuat HRD.' },
	{ title: 'Buka Absen', desc: 'Lihat tanggal & jam otomatis dari server.' },
	{ title: 'Ambil Foto', desc: 'Foto lewat kamera sebagai bukti WFH.' },
	{ title: 'Selesai', desc: 'Tekan "Absen Sekarang". Lihat riwayat kapan saja.' },
]

const ADMIN_STEPS = [
	{ title: 'Login sebagai HRD', desc: 'Masuk ke dasbor admin khusus HRD.' },
	{
		title: 'Kelola Karyawan',
		desc: 'Tambah/edit/nonaktifkan — akun login dibuat otomatis.',
	},
	{
		title: 'Pantau Absensi',
		desc: 'Lihat absensi semua karyawan (view-only) dengan filter & foto.',
	},
]

const FEATURES: {
	icon: ComponentType<{ className?: string }>
	title: string
	desc: string
}[] = [
	{ icon: Camera, title: 'Foto bukti WFH', desc: 'Kamera langsung sebagai bukti kehadiran.' },
	{ icon: Clock, title: 'Waktu dari server', desc: 'Anti-manipulasi — bukan jam perangkat.' },
	{ icon: Shield, title: 'Role-based access', desc: 'Akses dipisah: Karyawan vs HRD.' },
	{ icon: CalendarX2, title: 'Cegah absen ganda', desc: 'Satu Clock In & Out per hari.' },
	{ icon: LineChart, title: 'Riwayat & monitoring', desc: 'Karyawan lihat sendiri; HRD lihat semua.' },
	{ icon: Archive, title: 'Soft delete', desc: 'Nonaktifkan karyawan, riwayat tetap aman.' },
]

const container = 'mx-auto max-w-[1080px] px-7'

export function HowItWorksPage() {
	const [now, setNow] = useState(() => new Date())
	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000)
		return () => window.clearInterval(id)
	}, [])

	return (
		<div>
			{/* Hero */}
			<section
				className={`${container} grid grid-cols-1 items-center gap-12 pb-12 pt-16 lg:grid-cols-[1.05fr_.95fr]`}
			>
				<div>
					<span className="mb-5 inline-block rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary-700">
						ABSENSI WFH BERBASIS FOTO
					</span>
					<h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-ink-strong sm:text-[42px]">
						Absensi WFH + monitoring karyawan untuk HRD.
					</h1>
					<p className="mb-7 max-w-[480px] text-base leading-relaxed text-ink-muted">
						Karyawan absen dari rumah dengan foto bukti — waktu dicatat otomatis
						oleh server. HRD mengelola data karyawan dan memantau seluruh tim dari
						satu dasbor.
					</p>
					<div className="flex flex-wrap gap-3">
						<Link
							to="/login"
							className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-700"
						>
							Masuk
							<ArrowRight className="size-4" />
						</Link>
						<Link
							to="/teknologi"
							className="inline-flex h-12 items-center rounded-xl border border-line bg-white px-5 text-[15px] font-semibold text-ink hover:border-primary hover:text-primary"
						>
							Lihat Teknologi
						</Link>
					</div>
				</div>

				{/* Hero mock */}
				<div className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 p-6 text-white shadow-[0_24px_50px_rgba(165,40,35,0.28)]">
					<div className="mb-1.5 flex items-center gap-2 text-[11px] uppercase tracking-wide text-white/70">
						<span className="size-1.5 rounded-full bg-emerald-300" />
						Waktu server
					</div>
					<div className="text-[46px] font-bold leading-none tabular-nums">
						{formatClock(now)}
					</div>
					<div className="mt-1.5 text-[13px] text-white/80">
						{formatDateLong(now)}
					</div>
					{/* Photo: Pexels (free license), Ketut Subiyanto. */}
					<div className="relative mt-4 aspect-[5/3] overflow-hidden rounded-xl border border-white/20">
						<img
							src="/hero-wfh.jpg"
							alt="Karyawan absen WFH lewat kamera dari rumah"
							className="size-full object-cover"
						/>
						<div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
							<Camera className="size-3" />
							Foto bukti WFH
						</div>
						<div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-[10.5px] font-semibold text-success-text">
							<Check className="size-3" />
							Foto siap
						</div>
					</div>
					<div className="mt-4 flex h-11 items-center justify-center rounded-xl bg-white text-sm font-bold text-primary">
						Absen Sekarang
					</div>
				</div>
			</section>

			{/* Audience */}
			<section className={`${container} pb-2 pt-6`}>
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
					{[
						{
							icon: User,
							title: 'Untuk Karyawan',
							desc: 'Absen dari rumah dengan foto bukti, dan lihat riwayat absensimu kapan saja.',
						},
						{
							icon: Users,
							title: 'Untuk Admin HRD',
							desc: 'Kelola data karyawan dan pantau absensi seluruh tim secara view-only.',
						},
					].map((card) => (
						<div
							key={card.title}
							className="rounded-2xl border border-line bg-surface-2 p-6"
						>
							<div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary-50">
								<card.icon className="size-5 text-primary" />
							</div>
							<h3 className="mb-2 text-lg font-bold text-ink-strong">
								{card.title}
							</h3>
							<p className="text-sm leading-relaxed text-ink-muted">
								{card.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Employee steps */}
			<section className={`${container} pb-2 pt-12`}>
				<h2 className="mb-1.5 text-2xl font-bold text-ink-strong">
					Cara kerja untuk Karyawan
				</h2>
				<p className="mb-7 text-sm text-ink-muted">
					Empat langkah, selesai dalam hitungan detik.
				</p>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{EMPLOYEE_STEPS.map((step, i) => (
						<div key={step.title} className="rounded-2xl border border-line p-5">
							<div className="mb-3.5 flex size-9 items-center justify-center rounded-[9px] bg-primary font-bold text-white">
								{i + 1}
							</div>
							<h4 className="mb-1.5 text-sm font-bold text-ink-strong">
								{step.title}
							</h4>
							<p className="text-[13px] leading-relaxed text-ink-muted">
								{step.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Admin steps */}
			<section className={`${container} pb-2 pt-11`}>
				<h2 className="mb-1.5 text-2xl font-bold text-ink-strong">
					Cara kerja untuk Admin HRD
				</h2>
				<p className="mb-7 text-sm text-ink-muted">
					Kelola tim dan pantau kehadiran tanpa bisa memanipulasi data.
				</p>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					{ADMIN_STEPS.map((step, i) => (
						<div key={step.title} className="rounded-2xl border border-line p-5">
							<div className="mb-3.5 flex size-9 items-center justify-center rounded-[9px] bg-ink-strong font-bold text-white">
								{i + 1}
							</div>
							<h4 className="mb-1.5 text-sm font-bold text-ink-strong">
								{step.title}
							</h4>
							<p className="text-[13px] leading-relaxed text-ink-muted">
								{step.desc}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Features */}
			<section className={`${container} pb-2 pt-12`}>
				<h2 className="mb-7 text-2xl font-bold text-ink-strong">Fitur unggulan</h2>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((f) => (
						<div
							key={f.title}
							className="flex gap-3.5 rounded-2xl border border-line p-5"
						>
							<div className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-primary-50">
								<f.icon className="size-[19px] text-primary" />
							</div>
							<div>
								<h4 className="mb-1 text-sm font-bold text-ink-strong">
									{f.title}
								</h4>
								<p className="text-[12.5px] leading-relaxed text-ink-muted">
									{f.desc}
								</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Demo callout */}
			<section className={`${container} py-12`}>
				<div className="grid grid-cols-1 items-center gap-8 rounded-3xl bg-gradient-to-br from-ink-strong to-[#2A2A2E] p-9 lg:grid-cols-[1.2fr_1fr]">
					<div>
						<h2 className="mb-2 text-2xl font-bold text-white">Coba akun demo</h2>
						<p className="mb-5 max-w-[420px] text-sm leading-relaxed text-white/70">
							Masuk langsung tanpa registrasi untuk mencoba kedua peran.
						</p>
						<Link
							to="/login"
							className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-500"
						>
							Masuk sekarang
							<ArrowRight className="size-4" />
						</Link>
					</div>
					<div className="flex flex-col gap-3">
						{[
							{ role: 'Admin HRD', email: 'admin@dexa.com', pass: 'Admin123' },
							{ role: 'Karyawan', email: 'budi@dexa.com', pass: 'Employee123' },
						].map((acc) => (
							<div
								key={acc.email}
								className="rounded-xl border border-white/12 bg-white/8 p-4"
							>
								<div className="mb-1.5 text-[11.5px] uppercase tracking-wide text-white/60">
									{acc.role}
								</div>
								<div className="font-mono text-[13.5px] text-white">
									{acc.email}
								</div>
								<div className="font-mono text-[13.5px] text-white/70">
									{acc.pass}
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		</div>
	)
}
