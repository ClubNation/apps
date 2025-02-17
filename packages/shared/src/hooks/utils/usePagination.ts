import { MouseEventHandler, useCallback, useMemo, useState } from 'react';

export interface UsePagination<T = unknown> {
  onNext: MouseEventHandler;
  onPrevious: MouseEventHandler;
  current: number;
  max: number;
  paginated: T[];
}

interface UsePaginationProps<T = unknown> {
  items: T[];
  limit: number;
}

export const usePagination = <T = unknown>({
  items,
  limit,
}: UsePaginationProps<T>): UsePagination<T> => {
  const [page, setPage] = useState(1);

  return {
    max: Math.ceil(items?.length / limit),
    current: page,
    paginated: useMemo(
      () => items?.slice(limit * (page - 1), limit * page) ?? [],
      [items, limit, page],
    ),
    onNext: useCallback(() => setPage((value) => value - 1), []),
    onPrevious: useCallback(() => setPage((value) => value + 1), []),
  };
};
