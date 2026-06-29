/**
 * Shared shapes for paginated list responses. Reused across domains
 * (employees, attendances). Wrapped by the standard envelope as `data`.
 */

export interface PaginationMeta {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface PaginatedResult<T> {
	items: T[];
	meta: PaginationMeta;
}
