export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  totalPages: number;
  currentPage: number;
  totalCount: number;
  message?: string;
}

export function buildPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  currentPage: number,
  limit: number,
  message: string = 'Data fetched successfully',
): PaginatedResponse<T> {
  return {
    status: 'success',
    data,
    totalCount,
    currentPage,
    totalPages: Math.ceil(totalCount / limit),
    message,
  };
}

export function buildErrorResponse(error: any, defaultMessage: string = 'An error occurred') {
  return {
    status: 'error',
    message: error?.message || defaultMessage,
    data: [],
    totalCount: 0,
    currentPage: 1,
    totalPages: 0,
  };
}
