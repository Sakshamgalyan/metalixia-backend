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
  error: unknown,
  defaultMessage: string = 'An error occurred',
) {
  const message =
    error instanceof Error
      ? error.message
      : (error as Record<string, unknown>)?.message || defaultMessage;
  return {
    status: 'error',
    message,
  };
}
