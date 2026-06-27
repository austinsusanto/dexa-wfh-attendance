import { PaginatedResult, PaginationMeta } from '../types/pagination.types';

/** Computes the SQL OFFSET for a given page/limit. */
export function getSkip(page: number, limit: number): number {
	return (page - 1) * limit;
}

/** Wraps a page of rows + total count into the standard paginated shape. */
export function buildPaginatedResult<T>(
	items: T[],
	total: number,
	page: number,
	limit: number,
): PaginatedResult<T> {
	const meta: PaginationMeta = {
		total,
		page,
		limit,
		totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
	};
	return { items, meta };
}
