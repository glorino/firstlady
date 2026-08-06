export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function parsePagination(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
  return { page, limit, skip: (page - 1) * limit };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
