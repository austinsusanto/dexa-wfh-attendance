/** Runtime configuration read from Vite env vars (see .env.example). */
export const env = {
	apiBaseUrl:
		import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1',
	apiOrigin: import.meta.env.VITE_API_ORIGIN ?? 'http://localhost:3000',
}

/** Builds an absolute URL for an uploaded photo path returned by the API. */
export function photoUrl(photoPath: string): string {
	return `${env.apiOrigin}/${photoPath}`
}
