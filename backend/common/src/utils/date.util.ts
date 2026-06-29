/**
 * Business timezone for the whole system. "Today" for an attendance punch is
 * always defined in WIB, not in the server's local timezone (which is UTC inside
 * the deploy containers). Hard-coded on purpose: the frontend pins the same zone
 * so FE and BE always agree on which calendar day a punch belongs to, regardless
 * of where either runs. Keep this in sync with frontend `APP_TIMEZONE`.
 */
export const APP_TIMEZONE = 'Asia/Jakarta';

/**
 * Formats a Date as a YYYY-MM-DD string in the business timezone (WIB), for the
 * `attendance_date` DATE column. Computed explicitly via Intl so the result does
 * not depend on the container's `TZ`.
 */
export function toDateString(date: Date): string {
	// en-CA renders ISO-style YYYY-MM-DD parts.
	const parts = new Intl.DateTimeFormat('en-CA', {
		timeZone: APP_TIMEZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	}).formatToParts(date);

	const get = (type: string) =>
		parts.find((part) => part.type === type)?.value ?? '';
	return `${get('year')}-${get('month')}-${get('day')}`;
}
