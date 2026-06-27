/**
 * Shared shapes for the standard API response envelope.
 */

export interface ApiResponse<T> {
	success: true;
	message: string;
	data: T;
}

export interface ApiErrorResponse {
	success: false;
	message: string;
	errors?: unknown;
}