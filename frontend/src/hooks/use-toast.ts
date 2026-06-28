import { useContext } from 'react'
import { ToastContext } from '../context/toast-context'

/** Access the toast pusher; throws if used outside <ToastProvider>. */
export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) {
		throw new Error('useToast must be used within a ToastProvider')
	}
	return ctx
}
