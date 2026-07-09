type PaginationOptions = {
  page: number;
  perPage: number;
};

export type PaginationQuery = {
  page?: number;
  perPage?: number;
};

export type Paginated = {
  totalPages: number;
  page: number;
  nextPage: number;
  previousPage: number;
  perPage: number;
  currentPageItems: number;
  totalItems: number;
};

export type PaginatedData<T> = { data: T[]; paginated: Paginated };

function getNextPage(currentPage: number, totalPages: number) {
  const nextPage = currentPage + 1;
  if (nextPage > totalPages) {
    return 1;
  }

  return nextPage;
}

function getPreviousPage(currentPage: number, totalPages: number) {
  const nextPage = currentPage - 1;
  if (nextPage <= 0) {
    return totalPages;
  }

  if (nextPage > totalPages) {
    return totalPages;
  }

  return nextPage;
}

function getPerpage(totalItems: number, perPage: number) {
  if (perPage < 0) {
    return totalItems;
  }

  return perPage;
}

function getPage(totalPages: number, page: number) {
  if (page > totalPages) {
    return totalPages;
  }

  return page;
}

export function getTotalPage(totalItems: number, perPage: number) {
  if (totalItems <= 0) {
    return 1;
  }

  return Math.ceil(totalItems / perPage);
}

export function getOffset(options: PaginationOptions) {
  if (!options.perPage || options.perPage < 0) {
    return undefined;
  }

  return Math.abs((options.page - 1) * (options.perPage || 0));
}

export function getLimit(options: PaginationOptions) {
  if (!options.perPage || options.perPage < 0) {
    return undefined;
  }

  return options.perPage;
}

function getDefaultPagination(pagination?: PaginationQuery): PaginationOptions {
  pagination ??= {
    page: 1,
    perPage: -1,
  };

  pagination.page ??= 1;
  pagination.perPage ??= -1;

  return pagination as PaginationOptions;
}

export function getQueryPagination(pagination?: PaginationQuery) {
  const query = getDefaultPagination(pagination);

  const limit = getLimit(query);
  const offset = getOffset(query);

  return { limit, offset };
}

export function getPagination(
  datas: object[],
  totalItems: number,
  pagination?: PaginationQuery,
): Paginated {
  const query = getDefaultPagination(pagination);

  const perPage = getPerpage(totalItems, query.perPage);
  const totalPages = getTotalPage(totalItems, perPage);

  return {
    totalPages,
    page: getPage(totalPages, query.page),
    nextPage: getNextPage(query.page, totalPages),
    previousPage: getPreviousPage(query.page, totalPages),
    perPage,
    currentPageItems: datas.length,
    totalItems,
  };
}

export function getEmptyPagination(options?: PaginationQuery) {
  return getPagination([], 0, options || {});
}
