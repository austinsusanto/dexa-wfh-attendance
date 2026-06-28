/** Standard success envelope returned by the backend. */
export interface ApiResponse<T> {
	success: true
	message: string
	data: T
}

export interface PaginationMeta {
	total: number
	page: number
	limit: number
	totalPages: number
}

export interface Paginated<T> {
	items: T[]
	meta: PaginationMeta
}
