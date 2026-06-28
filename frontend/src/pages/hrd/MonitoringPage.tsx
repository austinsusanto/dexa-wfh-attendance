import { useEffect, useState } from 'react'
import { CalendarClock, Eye, Loader2, MapPin } from 'lucide-react'
import { AttendanceTypeBadge } from '../../components/AttendanceTypeBadge'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { PhotoPreviewModal } from '../../components/PhotoPreviewModal'
import { cn } from '../../lib/cn'
import { photoUrl } from '../../config/env'
import { formatDateShort, formatTimeShort } from '../../lib/datetime'
import { initialsFromName } from '../../lib/user'
import { useToast } from '../../hooks/use-toast'
import { listAllAttendances } from '../../api/attendances.service'
import { listEmployees } from '../../api/employees.service'
import { getApiErrorMessage } from '../../api/client'
import type { Paginated } from '../../types/api.types'
import type { Attendance, AttendanceType } from '../../types/attendance.types'
import type { Employee } from '../../types/employee.types'

const LIMIT = 10

const fieldClass =
	'h-10 rounded-lg border border-line bg-white px-3 text-[13.5px] text-ink-strong outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15'

function MapsLink({ row }: { row: Attendance }) {
	if (row.latitude == null || row.longitude == null) {
		return <span className="text-ink-muted">—</span>
	}
	return (
		<a
			href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`}
			target="_blank"
			rel="noreferrer"
			onClick={(e) => e.stopPropagation()}
			className="inline-flex items-center gap-1 text-[13px] font-medium text-info hover:underline"
		>
			<MapPin className="size-3.5" />
			Lihat
		</a>
	)
}

export function MonitoringPage() {
	const { push } = useToast()
	const [employees, setEmployees] = useState<Employee[]>([])
	const [employeeId, setEmployeeId] = useState('')
	const [date, setDate] = useState('')
	const [type, setType] = useState('')
	const [page, setPage] = useState(1)

	const [data, setData] = useState<Paginated<Attendance> | null>(null)
	const [loading, setLoading] = useState(true)
	const [selected, setSelected] = useState<Attendance | null>(null)

	// Employee dropdown options.
	useEffect(() => {
		listEmployees({ limit: 100 })
			.then((res) => setEmployees(res.items))
			.catch(() => undefined)
	}, [])

	useEffect(() => {
		let active = true
		setLoading(true)
		listAllAttendances({
			employeeId: employeeId ? Number(employeeId) : undefined,
			date: date || undefined,
			type: (type || undefined) as AttendanceType | undefined,
			page,
			limit: LIMIT,
		})
			.then((res) => {
				if (active) setData(res)
			})
			.catch((err) => {
				if (active) push('error', getApiErrorMessage(err, 'Gagal memuat absensi'))
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [employeeId, date, type, page, push])

	function reset() {
		setEmployeeId('')
		setDate('')
		setType('')
		setPage(1)
	}

	const items = data?.items ?? []
	const isEmpty = !loading && items.length === 0
	const filterActive = Boolean(employeeId || date || type)

	return (
		<div>
			<div className="mb-4 flex items-center gap-2.5">
				<p className="text-[13.5px] text-ink-muted">
					Pantau absensi seluruh karyawan.
				</p>
				<Badge variant="info">
					<Eye className="size-3" />
					View only
				</Badge>
			</div>

			{/* Filters */}
			<div className="mb-4 flex flex-wrap items-end gap-3.5 rounded-xl border border-line bg-surface p-4">
				<div className="min-w-[180px]">
					<label className="mb-1.5 block text-xs font-semibold text-ink-muted">
						Karyawan
					</label>
					<select
						value={employeeId}
						onChange={(e) => {
							setEmployeeId(e.target.value)
							setPage(1)
						}}
						className={cn(fieldClass, 'w-full')}
					>
						<option value="">Semua karyawan</option>
						{employees.map((emp) => (
							<option key={emp.id} value={emp.id}>
								{emp.fullName} ({emp.employeeNumber})
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1.5 block text-xs font-semibold text-ink-muted">
						Tanggal
					</label>
					<input
						type="date"
						value={date}
						onChange={(e) => {
							setDate(e.target.value)
							setPage(1)
						}}
						className={fieldClass}
					/>
				</div>
				<div className="min-w-[150px]">
					<label className="mb-1.5 block text-xs font-semibold text-ink-muted">
						Tipe
					</label>
					<select
						value={type}
						onChange={(e) => {
							setType(e.target.value)
							setPage(1)
						}}
						className={cn(fieldClass, 'w-full')}
					>
						<option value="">Semua tipe</option>
						<option value="CLOCK_IN">Clock In</option>
						<option value="CLOCK_OUT">Clock Out</option>
					</select>
				</div>
				<button
					type="button"
					onClick={reset}
					disabled={!filterActive}
					className={cn(
						'h-10 rounded-lg border px-4 text-[13.5px] font-medium transition-colors',
						filterActive
							? 'border-line bg-white text-ink hover:border-primary hover:bg-primary-50 hover:text-primary-700'
							: 'cursor-not-allowed border-line bg-white text-ink-muted opacity-50',
					)}
				>
					Reset
				</button>
			</div>

			{/* Content */}
			{loading && !data ? (
				<div className="flex justify-center rounded-xl border border-line bg-surface py-16">
					<Loader2 className="size-6 animate-spin text-primary" />
				</div>
			) : isEmpty ? (
				<div className="rounded-xl border border-line bg-surface py-14 text-center">
					<div className="mx-auto mb-3.5 flex size-13 items-center justify-center rounded-full bg-[#F1F2F4]">
						<CalendarClock className="size-6 text-ink-muted" />
					</div>
					<div className="text-sm text-ink-muted">
						Tidak ada data absensi untuk filter ini.
					</div>
				</div>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
						<div className="overflow-x-auto">
							<table className="w-full min-w-[880px] border-collapse">
								<thead>
									<tr className="border-b border-line bg-[#FAFBFC] text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
										<th className="px-4.5 py-3">Karyawan</th>
										<th className="px-3.5 py-3">Tanggal</th>
										<th className="px-3.5 py-3">Waktu</th>
										<th className="px-3.5 py-3">Tipe</th>
										<th className="px-3.5 py-3">Lokasi</th>
										<th className="px-3.5 py-3">Catatan</th>
										<th className="px-4.5 py-3 text-right">Foto</th>
									</tr>
								</thead>
								<tbody>
									{items.map((row) => (
										<tr
											key={row.id}
											onClick={() => setSelected(row)}
											className="cursor-pointer border-b border-line/60 hover:bg-surface-2"
										>
											<td className="px-4.5 py-3">
												<div className="flex items-center gap-2.5">
													<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
														{initialsFromName(row.employee?.fullName ?? '?')}
													</div>
													<div>
														<div className="whitespace-nowrap text-[13.5px] font-semibold text-ink-strong">
															{row.employee?.fullName ?? '—'}
														</div>
														<div className="text-xs text-ink-muted">
															{row.employee?.employeeNumber ?? ''}
														</div>
													</div>
												</div>
											</td>
											<td className="whitespace-nowrap px-3.5 py-3 text-[13px] text-ink">
												{formatDateShort(row.attendanceDate)}
											</td>
											<td className="px-3.5 py-3 text-[13px] tabular-nums text-ink">
												{formatTimeShort(row.checkedInAt)}
											</td>
											<td className="px-3.5 py-3">
												<AttendanceTypeBadge type={row.type} />
											</td>
											<td className="px-3.5 py-3">
												<MapsLink row={row} />
											</td>
											<td className="max-w-[200px] truncate px-3.5 py-3 text-[13px] text-ink-muted">
												{row.notes || '—'}
											</td>
											<td className="px-4.5 py-3">
												<img
													src={photoUrl(row.photoPath)}
													alt=""
													title="Lihat foto"
													className="ml-auto block size-10 overflow-hidden rounded-lg border border-line object-cover"
												/>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Mobile cards */}
					<div className="flex flex-col gap-2.5 md:hidden">
						{items.map((row) => (
							<button
								key={row.id}
								type="button"
								onClick={() => setSelected(row)}
								className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left"
							>
								<img
									src={photoUrl(row.photoPath)}
									alt=""
									className="size-12 shrink-0 rounded-lg border border-line object-cover"
								/>
								<div className="min-w-0 flex-1">
									<div className="flex items-center justify-between gap-2">
										<span className="truncate text-[13.5px] font-semibold text-ink-strong">
											{row.employee?.fullName ?? '—'}
										</span>
										<AttendanceTypeBadge type={row.type} />
									</div>
									<div className="mt-0.5 text-[12.5px] text-ink-muted">
										{formatDateShort(row.attendanceDate)} ·{' '}
										<span className="tabular-nums">
											{formatTimeShort(row.checkedInAt)}
										</span>
									</div>
									{row.notes && (
										<div className="truncate text-[12.5px] text-ink-muted">
											{row.notes}
										</div>
									)}
								</div>
							</button>
						))}
					</div>

					{data && (
						<Pagination
							meta={data.meta}
							onPageChange={(p) => setPage(p)}
						/>
					)}
				</>
			)}

			<PhotoPreviewModal
				attendance={selected}
				onClose={() => setSelected(null)}
			/>
		</div>
	)
}
