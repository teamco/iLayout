import type { TablePaginationConfig } from 'antd/es/table/interface';

export const DEFAULT_CURRENT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SIZE_CHANGER = 10;

type HandlePaginationArgs<T> = {
  entities: T[];
  total: number;
  pagination: TablePaginationConfig;
};

export function handlePagination<T>({ entities, total, pagination }: HandlePaginationArgs<T>): TablePaginationConfig {
  return {
    ...pagination,
    total: total || entities.length,
  };
}
