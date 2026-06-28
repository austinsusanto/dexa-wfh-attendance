import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmDialogProps {
	open: boolean
	title: string
	message: ReactNode
	confirmLabel: string
	onConfirm: () => void
	onClose: () => void
	loading?: boolean
}

/** Destructive confirmation dialog (danger styling + alert icon). */
export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel,
	onConfirm,
	onClose,
	loading = false,
}: ConfirmDialogProps) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && !loading) onClose()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open, onClose, loading])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div
				className="absolute inset-0 bg-[rgba(20,20,22,0.45)]"
				onClick={() => !loading && onClose()}
			/>
			<div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)]">
				<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger-bg">
					<AlertTriangle className="size-[22px] text-danger" />
				</div>
				<h3 className="mb-2 text-[17px] font-bold text-ink-strong">{title}</h3>
				<p className="mb-5 text-[13.5px] leading-relaxed text-ink-muted">
					{message}
				</p>
				<div className="flex justify-end gap-2.5">
					<button
						type="button"
						onClick={onClose}
						disabled={loading}
						className="h-10 rounded-lg border border-line bg-white px-4 text-sm font-medium text-ink hover:border-line-strong disabled:opacity-60"
					>
						Batal
					</button>
					<button
						type="button"
						onClick={onConfirm}
						disabled={loading}
						className="flex h-10 items-center gap-2 rounded-lg bg-danger px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
					>
						{loading && <Loader2 className="size-4 animate-spin" />}
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	)
}
