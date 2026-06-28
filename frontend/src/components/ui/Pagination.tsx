import { cn } from '../../lib/cn'
import type { PaginationMeta } from '../../types/api.types'

interface PaginationProps {
	meta: PaginationMeta
	onPageChange: (page: number) => void
}

/** Builds a compact, windowed list of page numbers around the current page. */
function pageWindow(current: number, total: number): number[] {
	const span = 5
	let start = Math.max(1, current - Math.floor(span / 2))
	const end = Math.min(total, start + span - 1)
	start = Math.max(1, end - span + 1)
	const pages: number[] = []
	for (let p = start; p <= end; p++) pages.push(p)
	return pages
}

/** Result caption + Prev / numbered / Next controls. */
export function Pagination({ meta, onPageChange }: PaginationProps) {
	const { page, limit, total, totalPages } = meta
	const start = total === 0 ? 0 : (page - 1) * limit + 1
	const end = Math.min(page * limit, total)

	const btn =
		'h-8.5 min-w-8.5 rounded-md border px-2.5 text-[13px] font-medium transition-colors'

	return (
		<div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
			<span className="text-[12.5px] text-ink-muted">
				Menampilkan {start}–{end} dari {total}
			</span>
			<div className="flex gap-1.5">
				{page > 1 && (
					<button
						type="button"
						onClick={() => onPageChange(page - 1)}
						className={cn(
							btn,
							'border-line bg-white text-ink-muted hover:border-line-strong',
						)}
					>
						Sebelumnya
					</button>
				)}
				{pageWindow(page, totalPages).map((p) => (
					<button
						key={p}
						type="button"
						onClick={() => onPageChange(p)}
						className={cn(
							btn,
							p === page
								? 'border-primary bg-primary text-white'
								: 'border-line bg-white text-ink hover:border-line-strong',
						)}
					>
						{p}
					</button>
				))}
				{page < totalPages && (
					<button
						type="button"
						onClick={() => onPageChange(page + 1)}
						className={cn(
							btn,
							'border-line bg-white text-ink-muted hover:border-line-strong',
						)}
					>
						Selanjutnya
					</button>
				)}
			</div>
		</div>
	)
}
