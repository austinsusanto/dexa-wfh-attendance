/** HH:MM:SS in 24h (for the live clock). */
export function formatClock(date: Date): string {
	return date.toLocaleTimeString('id-ID', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})
}

/** "Minggu, 28 Juni 2026". */
export function formatDateLong(date: Date): string {
	return date.toLocaleDateString('id-ID', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

/** HH:MM from an ISO timestamp. */
export function formatTimeShort(iso: string): string {
	return new Date(iso).toLocaleTimeString('id-ID', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	})
}

/** "28 Jun 2026" from a YYYY-MM-DD or ISO string. */
export function formatDateShort(value: string): string {
	return new Date(value).toLocaleDateString('id-ID', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}

/** Local YYYY-MM-DD for today. */
export function todayString(): string {
	const now = new Date()
	const y = now.getFullYear()
	const m = String(now.getMonth() + 1).padStart(2, '0')
	const d = String(now.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}
