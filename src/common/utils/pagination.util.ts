export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  currentPage: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    data,
    totalCount,
    currentPage,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export function buildErrorResponse(
  error: any,
  defaultMessage: string = 'An error occurred',
) {
  return {
    status: 'error',
    message: error?.message || defaultMessage,
  };
}
