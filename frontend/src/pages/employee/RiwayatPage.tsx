import { useEffect, useState } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { AttendanceTypeBadge } from '../../components/AttendanceTypeBadge'
import { Pagination } from '../../components/ui/Pagination'
import { PhotoPreviewModal } from '../../components/PhotoPreviewModal'
import { cn } from '../../lib/cn'
import { photoUrl } from '../../config/env'
import { formatDateShort, formatTimeShort } from '../../lib/datetime'
import { useToast } from '../../hooks/use-toast'
import { listMyAttendances } from '../../api/attendances.service'
import { getApiErrorMessage } from '../../api/client'
import type { Paginated } from '../../types/api.types'
import type { Attendance } from '../../types/attendance.types'

const LIMIT = 10

interface Query {
	from?: string
	to?: string
	page: number
}

const dateInputClass =
	'h-10 rounded-lg border border-line bg-white px-3 text-[13.5px] text-ink-strong outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15'

export function RiwayatPage() {
	const { push } = useToast()
	const [fromInput, setFromInput] = useState('')
	const [toInput, setToInput] = useState('')
	const [query, setQuery] = useState<Query>({ page: 1 })
	const [data, setData] = useState<Paginated<Attendance> | null>(null)
	const [loading, setLoading] = useState(true)
	const [selected, setSelected] = useState<Attendance | null>(null)

	useEffect(() => {
		let active = true
		setLoading(true)
		listMyAttendances({
			from: query.from,
			to: query.to,
			page: query.page,
			limit: LIMIT,
		})
			.then((res) => {
				if (active) setData(res)
			})
			.catch((err) => {
				if (active) push('error', getApiErrorMessage(err, 'Gagal memuat riwayat'))
			})
			.finally(() => {
				if (active) setLoading(false)
			})
		return () => {
			active = false
		}
	}, [query, push])

	function apply() {
		setQuery({ from: fromInput || undefined, to: toInput || undefined, page: 1 })
	}

	function reset() {
		setFromInput('')
		setToInput('')
		setQuery({ page: 1 })
	}

	const items = data?.items ?? []
	const isEmpty = !loading && items.length === 0
	const filterActive = Boolean(fromInput || toInput || query.from || query.to)

	return (
		<div className="w-full max-w-[880px]">
			<div className="mb-5">
				<h1 className="text-[23px] font-bold text-ink-strong">Riwayat Absensi</h1>
				<p className="text-sm text-ink-muted">
					Seluruh catatan absensi Anda, terbaru di atas.
				</p>
			</div>

			{/* Filter bar */}
			<div className="mb-4 flex flex-wrap items-end gap-3.5 rounded-xl border border-line bg-surface p-4">
				<div>
					<label className="mb-1.5 block text-xs font-semibold text-ink-muted">
						Dari
					</label>
					<input
						type="date"
						value={fromInput}
						onChange={(e) => setFromInput(e.target.value)}
						className={dateInputClass}
					/>
				</div>
				<div>
					<label className="mb-1.5 block text-xs font-semibold text-ink-muted">
						Sampai
					</label>
					<input
						type="date"
						value={toInput}
						onChange={(e) => setToInput(e.target.value)}
						className={dateInputClass}
					/>
				</div>
				<button
					type="button"
					onClick={apply}
					className="h-10 rounded-lg bg-primary px-4.5 text-[13.5px] font-semibold text-white hover:bg-primary-700"
				>
					Terapkan
				</button>
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
						<CalendarDays className="size-6 text-ink-muted" />
					</div>
					<div className="text-sm text-ink-muted">
						Belum ada riwayat absensi pada rentang ini.
					</div>
				</div>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
						<table className="w-full border-collapse">
							<thead>
								<tr className="border-b border-line bg-[#FAFBFC] text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
									<th className="px-4.5 py-3">Tanggal</th>
									<th className="px-3.5 py-3">Waktu</th>
									<th className="px-3.5 py-3">Tipe</th>
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
										<td className="whitespace-nowrap px-4.5 py-3 text-[13.5px] font-medium text-ink-strong">
											{formatDateShort(row.attendanceDate)}
										</td>
										<td className="px-3.5 py-3 text-[13.5px] tabular-nums text-ink">
											{formatTimeShort(row.checkedInAt)}
										</td>
										<td className="px-3.5 py-3">
											<AttendanceTypeBadge type={row.type} />
										</td>
										<td className="max-w-[260px] truncate px-3.5 py-3 text-[13px] text-ink-muted">
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
										<span className="text-[13.5px] font-semibold text-ink-strong">
											{formatDateShort(row.attendanceDate)}
										</span>
										<span className="text-[13px] tabular-nums text-ink-muted">
											{formatTimeShort(row.checkedInAt)}
										</span>
									</div>
									<div className="mt-1.5 flex items-center gap-2">
										<AttendanceTypeBadge type={row.type} />
										{row.notes && (
											<span className="truncate text-[12.5px] text-ink-muted">
												{row.notes}
											</span>
										)}
									</div>
								</div>
							</button>
						))}
					</div>

					{data && <Pagination meta={data.meta} onPageChange={(page) => setQuery((q) => ({ ...q, page }))} />}
				</>
			)}

			<PhotoPreviewModal attendance={selected} onClose={() => setSelected(null)} />
		</div>
	)
}
