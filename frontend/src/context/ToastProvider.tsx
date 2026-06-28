import { useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { ToastContext } from './toast-context'
import { cn } from '../lib/cn'
import type { Toast, ToastType } from '../types/toast.types'

const AUTO_DISMISS_MS = 3600

const TOAST_STYLES: Record<ToastType, { box: string; icon: ReactNode }> = {
	success: {
		box: 'border-success/30 bg-success-bg text-success-text',
		icon: <CheckCircle2 className="size-[18px] text-success" />,
	},
	error: {
		box: 'border-danger/30 bg-danger-bg text-danger-text',
		icon: <AlertCircle className="size-[18px] text-danger" />,
	},
	info: {
		box: 'border-info/30 bg-info-bg text-info-text',
		icon: <Info className="size-[18px] text-info" />,
	},
}

/** Renders top-right toasts and exposes `push` via context. */
export function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])
	const nextId = useRef(1)

	const remove = useCallback((id: number) => {
		setToasts((current) => current.filter((t) => t.id !== id))
	}, [])

	const push = useCallback(
		(type: ToastType, message: string) => {
			const id = nextId.current++
			setToasts((current) => [...current, { id, type, message }])
			window.setTimeout(() => remove(id), AUTO_DISMISS_MS)
		},
		[remove],
	)

	const value = useMemo(() => ({ push }), [push])

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={cn(
							'pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-[13.5px] font-medium shadow-[0_4px_16px_rgba(0,0,0,0.10)]',
							TOAST_STYLES[toast.type].box,
						)}
					>
						<span className="shrink-0">{TOAST_STYLES[toast.type].icon}</span>
						<span className="flex-1">{toast.message}</span>
						<button
							type="button"
							onClick={() => remove(toast.id)}
							aria-label="Tutup"
							className="shrink-0 opacity-60 hover:opacity-100"
						>
							<X className="size-4" />
						</button>
					</div>
				))}
			</div>
		</ToastContext.Provider>
	)
}
