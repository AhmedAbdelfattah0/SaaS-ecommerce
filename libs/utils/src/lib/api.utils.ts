/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

/**
 * Pagination query params
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Build a success API response
 */
export function successResponse<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { data, error: null, meta };
}

/**
 * Build an error API response
 */
export function errorResponse<T = null>(message: string): ApiResponse<T> {
  return { data: null, error: message };
}

/**
 * Compute pagination meta from total count
 */
export function paginationMeta(
  total: number,
  page: number,
  limit: number
): ApiResponse<unknown>['meta'] {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
