/**
 * Pagination utilities for server-side pagination
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Parse pagination params from query string with safe defaults
 */
export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  return { page, limit };
}

/**
 * Calculate offset from page and limit
 */
export function getOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

/**
 * Build pagination metadata from total count
 */
export function buildPaginationMeta(total: number, params: PaginationParams) {
  const totalPages = Math.ceil(total / params.limit);
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  };
}
