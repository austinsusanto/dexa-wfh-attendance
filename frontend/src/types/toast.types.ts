export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
	id: number
	type: ToastType
	message: string
}

export interface ToastContextValue {
	push: (type: ToastType, message: string) => void
}
