export const DEFAULT_LIMIT = 200;
export const MAX_LIMIT = 500;

export interface PageParams {
  page: number;
  limit: number;
  offset: number;
}

/** Shared by every admin list endpoint (Applicants, Contestants, ...). */
export function parsePageParams(query: {
  page?: unknown;
  limit?: unknown;
}): PageParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(query.limit) || DEFAULT_LIMIT),
  );
  return { page, limit, offset: (page - 1) * limit };
}

export function buildPageMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
