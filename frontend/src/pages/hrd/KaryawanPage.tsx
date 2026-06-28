import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmployeeFormModal } from '../../components/EmployeeFormModal'
import { cn } from '../../lib/cn'
import { initialsFromName } from '../../lib/user'
import { useToast } from '../../hooks/use-toast'
import {
	deactivateEmployee,
	listEmployees,
} from '../../api/employees.service'
import { getApiErrorMessage } from '../../api/client'
import type { Paginated } from '../../types/api.types'
import type { Employee } from '../../types/employee.types'

const LIMIT = 10

interface Query {
	search?: string
	page: number
}

export function KaryawanPage() {
	const { push } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const [query, setQuery] = useState<Query>({ page: 1 })
	const [data, setData] = useState<Paginated<Employee> | null>(null)
	const [loading, setLoading] = useState(true)

	const [modal, setModal] = useState<{
		open: boolean
		mode: 'create' | 'edit'
		employee: Employee | null
	}>({ open: false, mode: 'create', employee: null })
	const [confirm, setConfirm] = useState<{
		open: boolean
		target: Employee | null
		loading: boolean
	}>({ open: false, target: null, loading: false })

	const load = useCallback(async () => {
		setLoading(true)
		try {
			const res = await listEmployees({
				search: query.search,
				page: query.page,
				limit: LIMIT,
			})
			setData(res)
		} catch (err) {
			push('error', getApiErrorMessage(err, 'Gagal memuat karyawan'))
		} finally {
			setLoading(false)
		}
	}, [query, push])

	useEffect(() => {
		void load()
	}, [load])

	// Debounced search (skips the initial render).
	const firstRender = useRef(true)
	useEffect(() => {
		if (firstRender.current) {
			firstRender.current = false
			return
		}
		const id = window.setTimeout(() => {
			setQuery({ search: searchInput.trim() || undefined, page: 1 })
		}, 400)
		return () => window.clearTimeout(id)
	}, [searchInput])

	async function doDeactivate() {
		if (!confirm.target) return
		setConfirm((c) => ({ ...c, loading: true }))
		try {
			await deactivateEmployee(confirm.target.id)
			push('success', 'Karyawan dinonaktifkan')
			setConfirm({ open: false, target: null, loading: false })
			await load()
		} catch (err) {
			push('error', getApiErrorMessage(err, 'Gagal menonaktifkan karyawan'))
			setConfirm((c) => ({ ...c, loading: false }))
		}
	}

	const items = data?.items ?? []
	const isEmpty = !loading && items.length === 0
	const emptyMsg = query.search
		? 'Tidak ada karyawan yang cocok dengan pencarian.'
		: 'Belum ada karyawan. Tambah karyawan pertama Anda.'

	const iconBtn =
		'flex size-8.5 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors'

	return (
		<div>
			{/* Toolbar */}
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3.5">
				<div className="relative min-w-[220px] max-w-[360px] flex-1">
					<Search className="pointer-events-none absolute left-3.5 top-1/2 size-[17px] -translate-y-1/2 text-ink-muted" />
					<input
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						placeholder="Cari nama, ID Karyawan, email…"
						className="h-10.5 w-full rounded-lg border border-line bg-white pl-10 pr-3.5 text-[13.5px] text-ink-strong outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15"
					/>
				</div>
				<button
					type="button"
					onClick={() =>
						setModal({ open: true, mode: 'create', employee: null })
					}
					className="flex h-10.5 items-center gap-2 rounded-lg bg-primary px-4.5 text-sm font-semibold text-white hover:bg-primary-700"
				>
					<Plus className="size-[17px]" />
					Tambah Karyawan
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
						<Users className="size-6 text-ink-muted" />
					</div>
					<div className="text-sm text-ink-muted">{emptyMsg}</div>
				</div>
			) : (
				<>
					{/* Desktop table */}
					<div className="hidden overflow-hidden rounded-xl border border-line bg-surface md:block">
						<div className="overflow-x-auto">
							<table className="w-full min-w-[820px] border-collapse">
								<thead>
									<tr className="border-b border-line bg-[#FAFBFC] text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-muted">
										<th className="px-4.5 py-3">ID Karyawan</th>
										<th className="px-3.5 py-3">Nama</th>
										<th className="px-3.5 py-3">Jabatan</th>
										<th className="px-3.5 py-3">Departemen</th>
										<th className="px-3.5 py-3">Telepon</th>
										<th className="px-3.5 py-3">Status</th>
										<th className="px-4.5 py-3 text-right">Aksi</th>
									</tr>
								</thead>
								<tbody>
									{items.map((emp) => (
										<tr
											key={emp.id}
											className="border-b border-line/60 hover:bg-surface-2"
										>
											<td className="whitespace-nowrap px-4.5 py-3 text-[13px] tabular-nums text-ink-muted">
												{emp.employeeNumber}
											</td>
											<td className="px-3.5 py-3">
												<div className="flex items-center gap-2.5">
													<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
														{initialsFromName(emp.fullName)}
													</div>
													<div>
														<div className="text-[13.5px] font-semibold text-ink-strong">
															{emp.fullName}
														</div>
														<div className="text-xs text-ink-muted">
															{emp.email}
														</div>
													</div>
												</div>
											</td>
											<td className="whitespace-nowrap px-3.5 py-3 text-[13px] text-ink">
												{emp.position}
											</td>
											<td className="px-3.5 py-3 text-[13px] text-ink">
												{emp.department}
											</td>
											<td className="whitespace-nowrap px-3.5 py-3 text-[13px] tabular-nums text-ink-muted">
												{emp.phone}
											</td>
											<td className="px-3.5 py-3">
												{emp.isActive ? (
													<Badge variant="success" dot>
														Active
													</Badge>
												) : (
													<Badge variant="neutral">Inactive</Badge>
												)}
											</td>
											<td className="px-4.5 py-3">
												<div className="flex justify-end gap-1.5">
													<button
														type="button"
														title="Edit"
														onClick={() =>
															setModal({
																open: true,
																mode: 'edit',
																employee: emp,
															})
														}
														className={cn(
															iconBtn,
															'hover:border-primary hover:text-primary',
														)}
													>
														<Pencil className="size-[15px]" />
													</button>
													<button
														type="button"
														title="Nonaktifkan"
														disabled={!emp.isActive}
														onClick={() =>
															setConfirm({
																open: true,
																target: emp,
																loading: false,
															})
														}
														className={cn(
															iconBtn,
															'hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40',
														)}
													>
														<Trash2 className="size-[15px]" />
													</button>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>

					{/* Mobile cards */}
					<div className="flex flex-col gap-2.5 md:hidden">
						{items.map((emp) => (
							<div
								key={emp.id}
								className="rounded-xl border border-line bg-surface p-3.5"
							>
								<div className="flex items-start gap-3">
									<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
										{initialsFromName(emp.fullName)}
									</div>
									<div className="min-w-0 flex-1">
										<div className="flex items-center justify-between gap-2">
											<span className="truncate text-[13.5px] font-semibold text-ink-strong">
												{emp.fullName}
											</span>
											{emp.isActive ? (
												<Badge variant="success" dot>
													Active
												</Badge>
											) : (
												<Badge variant="neutral">Inactive</Badge>
											)}
										</div>
										<div className="truncate text-xs text-ink-muted">
											{emp.email}
										</div>
										<div className="mt-1 text-[12.5px] text-ink">
											{emp.position} · {emp.department}
										</div>
										<div className="text-[12.5px] tabular-nums text-ink-muted">
											{emp.employeeNumber} · {emp.phone}
										</div>
									</div>
								</div>
								<div className="mt-3 flex justify-end gap-1.5">
									<button
										type="button"
										onClick={() =>
											setModal({ open: true, mode: 'edit', employee: emp })
										}
										className={cn(
											iconBtn,
											'hover:border-primary hover:text-primary',
										)}
									>
										<Pencil className="size-[15px]" />
									</button>
									<button
										type="button"
										disabled={!emp.isActive}
										onClick={() =>
											setConfirm({ open: true, target: emp, loading: false })
										}
										className={cn(
											iconBtn,
											'hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-40',
										)}
									>
										<Trash2 className="size-[15px]" />
									</button>
								</div>
							</div>
						))}
					</div>

					{data && (
						<Pagination
							meta={data.meta}
							onPageChange={(page) => setQuery((q) => ({ ...q, page }))}
						/>
					)}
				</>
			)}

			<EmployeeFormModal
				open={modal.open}
				mode={modal.mode}
				employee={modal.employee}
				onClose={() => setModal((m) => ({ ...m, open: false }))}
				onSaved={load}
			/>

			<ConfirmDialog
				open={confirm.open}
				title="Nonaktifkan karyawan ini?"
				message={
					<>
						<b className="text-ink">{confirm.target?.fullName}</b> akan
						dinonaktifkan. Riwayat absensinya tetap tersimpan.
					</>
				}
				confirmLabel="Nonaktifkan"
				loading={confirm.loading}
				onConfirm={doDeactivate}
				onClose={() =>
					setConfirm({ open: false, target: null, loading: false })
				}
			/>
		</div>
	)
}
