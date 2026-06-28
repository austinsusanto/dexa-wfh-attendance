/**
 * Derives a display name from an email local-part (the token carries no name).
 * "budi.santoso@dexa.com" -> "Budi Santoso".
 */
export function displayNameFromEmail(email: string): string {
	const local = email.split('@')[0] ?? email
	return local
		.split(/[._-]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ')
}

export function firstNameFromEmail(email: string): string {
	return displayNameFromEmail(email).split(' ')[0] ?? email
}

/** Up to two uppercase initials from a display name. */
export function initialsFromName(name: string): string {
	const parts = name.split(' ').filter(Boolean)
	const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase())
	return letters.join('') || '?'
}
