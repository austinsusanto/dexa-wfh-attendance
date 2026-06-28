import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ModalProps {
	open: boolean
	onClose: () => void
	title?: string
	children: ReactNode
	footer?: ReactNode
	/** Width utility for the dialog (default max-w-lg). */
	widthClass?: string
}

/** Centered modal dialog: closes on overlay click, X, and Escape. */
export function Modal({
	open,
	onClose,
	title,
	children,
	footer,
	widthClass = 'max-w-lg',
}: ModalProps) {
	useEffect(() => {
		if (!open) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [open, onClose])

	if (!open) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-[rgba(20,20,22,0.45)]" onClick={onClose} />
			<div
				role="dialog"
				aria-modal="true"
				className={cn(
					'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-surface shadow-[0_24px_60px_rgba(0,0,0,0.24)]',
					widthClass,
				)}
			>
				{title && (
					<div className="flex items-center justify-between border-b border-line px-5 py-4">
						<h3 className="text-base font-bold text-ink-strong">{title}</h3>
						<button
							type="button"
							onClick={onClose}
							aria-label="Tutup"
							className="flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-canvas"
						>
							<X className="size-5" />
						</button>
					</div>
				)}
				<div className="overflow-y-auto px-5 py-4">{children}</div>
				{footer && (
					<div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">
						{footer}
					</div>
				)}
			</div>
		</div>
	)
}
