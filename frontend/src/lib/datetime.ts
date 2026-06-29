/**
 * Business timezone for the whole system. Times and "today" are always presented
 * in WIB so the frontend and backend agree on which calendar day a punch belongs
 * to, regardless of the viewer's browser timezone (the clock is labelled "Waktu
 * server"). Keep in sync with backend `APP_TIMEZONE`.
 */
export const APP_TIMEZONE = 'Asia/Jakarta'

/** HH:MM:SS in 24h (for the live clock), in WIB. */
export function formatClock(date: Date): string {
	return date.toLocaleTimeString('id-ID', {
		timeZone: APP_TIMEZONE,
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	})
}

/** "Minggu, 28 Juni 2026", in WIB. */
export function formatDateLong(date: Date): string {
	return date.toLocaleDateString('id-ID', {
		timeZone: APP_TIMEZONE,
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

/** HH:MM from an ISO timestamp, in WIB. */
export function formatTimeShort(iso: string): string {
	return new Date(iso).toLocaleTimeString('id-ID', {
		timeZone: APP_TIMEZONE,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	})
}

/** "28 Jun 2026" from a YYYY-MM-DD or ISO string, in WIB. */
export function formatDateShort(value: string): string {
	return new Date(value).toLocaleDateString('id-ID', {
		timeZone: APP_TIMEZONE,
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}

/** YYYY-MM-DD for today in the business timezone (WIB). */
export function todayString(): string {
	// en-CA renders ISO-style YYYY-MM-DD.
	return new Intl.DateTimeFormat('en-CA', {
		timeZone: APP_TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).format(new Date())
}
