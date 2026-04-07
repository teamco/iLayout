import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from '@tanstack/react-router';
import type { TableProps } from 'antd';
import type { TablePaginationConfig, TablePaginationPlacement } from 'antd/es/table/interface';

import type { EAntSort, ITableParams } from '@/components/Table/types';
import {
  DEFAULT_CURRENT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SIZE_CHANGER,
  handlePagination,
} from '@/components/Table/pagination';

/** Simple dot-path accessor */
function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

// --- URL serialization ---

function serializeTableState(
  state: { pagination: { current: number; pageSize: number }; filters: TFilters; sorts: TSorts },
  prefix: string,
): Record<string, string> {
  const p = prefix ? `${prefix}.` : '';
  const params: Record<string, string> = {};

  if (state.pagination.current !== DEFAULT_CURRENT_PAGE) {
    params[`${p}page`] = String(state.pagination.current);
  }
  if (state.pagination.pageSize !== DEFAULT_PAGE_SIZE) {
    params[`${p}pageSize`] = String(state.pagination.pageSize);
  }
  if (state.sorts.columnKey && state.sorts.order) {
    params[`${p}sort`] = `${state.sorts.columnKey}.${state.sorts.order}`;
  }
  for (const [key, values] of Object.entries(state.filters)) {
    if (values && Array.isArray(values) && values.length > 0) {
      params[`${p}filter_${key}`] = values.map(String).join(',');
    }
  }

  return params;
}

function deserializeTableState(
  searchParams: URLSearchParams,
  prefix: string,
): { pagination?: { current: number; pageSize: number }; filters: TFilters; sorts: TSorts } {
  const p = prefix ? `${prefix}.` : '';
  const page = searchParams.get(`${p}page`);
  const pageSize = searchParams.get(`${p}pageSize`);
  const sort = searchParams.get(`${p}sort`);

  const pagination = (page || pageSize)
    ? {
        current: page ? Number(page) : DEFAULT_CURRENT_PAGE,
        pageSize: pageSize ? Number(pageSize) : DEFAULT_PAGE_SIZE,
      }
    : undefined;

  let sorts: TSorts = { order: undefined, columnKey: undefined };
  if (sort) {
    const lastDot = sort.lastIndexOf('.');
    if (lastDot > 0) {
      sorts = {
        columnKey: sort.slice(0, lastDot),
        order: sort.slice(lastDot + 1) as EAntSort,
      };
    }
  }

  const filters: TFilters = {};
  searchParams.forEach((value, key) => {
    const filterPrefix = `${p}filter_`;
    if (key.startsWith(filterPrefix)) {
      const filterKey = key.slice(filterPrefix.length);
      filters[filterKey] = value.split(',');
    }
  });

  return { pagination, filters, sorts };
}

type TOnChange = NonNullable<TableProps<unknown>['onChange']>;
export type TFilters = Parameters<TOnChange>[1];
export type TSorts = {
  order?: EAntSort | null;
  columnKey?: string;
} & Parameters<TOnChange>[2];

export type TPagination = {
  current: number;
  defaultCurrent: number;
  hideOnSinglePage: boolean;
  pageSize: number;
  showTotal?: (total: number, range: number[]) => string;
  placement: TablePaginationPlacement[];
  showQuickJumper: boolean;
  showSizeChanger: boolean;
  total: number;
} & Parameters<TOnChange>[0];

export type TDefaults = {
  current?: number;
  pageSize?: number;
  sizeChanger?: number;
  defaultCurrent?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
};

export type TUseTableOptions = TDefaults & {
  tableId?: string;
  persistToUrl?: boolean;
  urlSyncDelay?: number;
  serverSidePagination?: boolean;
};

export type TUseTable = {
  tableParams: ITableParams;
  filteredInfo: TFilters;
  sortedInfo: TSorts;
  handleTableChange: TOnChange;
  filteredCount: number;
  computedFilteredCount: number;
  resetTableState: () => void;
};

export const useTable = <T>(entities: T[], total: number, options?: TUseTableOptions): TUseTable => {
  const { tableId = '', persistToUrl = true, urlSyncDelay = 300, serverSidePagination = false, ...defaults } = options || {};

  const location = useLocation();
  const [amount, setAmount] = useState<number>(total);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialMountRef = useRef(true);
  const lastSyncedStateRef = useRef<string>('');

  useEffect(() => {
    setAmount(total);
  }, [total]);

  // Read initial state from URL once on mount
  const initialUrlState = useMemo(() => {
    if (!persistToUrl) return null;
    const params = new URLSearchParams(location.search);
    return deserializeTableState(params, tableId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPage = initialUrlState?.pagination?.current || defaults?.current || DEFAULT_CURRENT_PAGE;
  const defaultCurrentPage = defaults?.defaultCurrent || currentPage;
  const pageSize = initialUrlState?.pagination?.pageSize || defaults?.pageSize || DEFAULT_PAGE_SIZE;
  const sizeChanger = defaults?.sizeChanger || DEFAULT_SIZE_CHANGER;

  const DEFAULT_PAGINATION = useMemo(
    () => ({
      defaultCurrent: defaultCurrentPage,
      placement: ['bottomEnd'] as TablePaginationPlacement[],
      showSizeChanger:
        typeof defaults?.showSizeChanger === 'boolean' ? defaults.showSizeChanger : entities.length > sizeChanger,
      showQuickJumper:
        typeof defaults?.showQuickJumper === 'boolean' ? defaults.showQuickJumper : entities.length > pageSize,
      hideOnSinglePage: true,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultCurrentPage, entities.length, sizeChanger, pageSize],
  );

  const [pagination, setPagination] = useState<TPagination>({
    total: amount,
    pageSize,
    current: currentPage,
    ...DEFAULT_PAGINATION,
  } as TPagination);

  const [filteredInfo, setFilteredInfo] = useState<TFilters>(initialUrlState?.filters || {});
  const [sortedInfo, setSortedInfo] = useState<TSorts>(
    initialUrlState?.sorts || { order: undefined, columnKey: undefined },
  );

  const computedFilteredCount = useMemo(() => {
    const hasActiveFilters = Object.keys(filteredInfo).some((key) => {
      const value = filteredInfo[key];
      return value && Array.isArray(value) && value.length > 0;
    });

    if (!hasActiveFilters) return entities.length;

    return entities.filter((entity) => {
      return Object.entries(filteredInfo).every(([key, filterValues]) => {
        if (!filterValues || !Array.isArray(filterValues) || filterValues.length === 0) return true;
        const entityValue = getByPath(entity, key);
        return (filterValues as unknown[]).includes(entityValue);
      });
    }).length;
  }, [entities, filteredInfo]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTableChange: TOnChange = (_pagination, filters, sorter: any, extra: any) => {
    const newDataLength = (extra.currentDataSource as unknown[]).length;
    if (!serverSidePagination) setAmount(newDataLength);

    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(filteredInfo);

    let newPagination = _pagination as TPagination;
    if (!serverSidePagination && filtersChanged && _pagination.current && _pagination.pageSize) {
      const maxPage = Math.ceil(newDataLength / _pagination.pageSize) || 1;
      if (_pagination.current > maxPage) {
        newPagination = { ..._pagination, current: 1 } as TPagination;
      }
    }

    setPagination(newPagination);
    setFilteredInfo(filters);
    setSortedInfo({ order: sorter.order, columnKey: sorter.columnKey } as TSorts);
  };

  const resetTableState = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      current: defaults?.current || DEFAULT_CURRENT_PAGE,
      pageSize: defaults?.pageSize || DEFAULT_PAGE_SIZE,
    }));
    setFilteredInfo({});
    setSortedInfo({ order: undefined, columnKey: undefined } as TSorts);
  }, [defaults?.current, defaults?.pageSize]);

  // --- Sync state to URL (debounced) ---
  const syncToUrl = useCallback(() => {
    if (!persistToUrl) return;

    const state = {
      pagination: { current: pagination.current, pageSize: pagination.pageSize },
      filters: filteredInfo,
      sorts: sortedInfo,
    };

    const serialized = serializeTableState(state, tableId);

    const newParams = new URLSearchParams(location.search);

    // Remove old table params
    const prefix = tableId ? `${tableId}.` : '';
    Array.from(newParams.keys()).forEach((key) => {
      if (
        key.startsWith(`${prefix}page`) ||
        key.startsWith(`${prefix}pageSize`) ||
        key.startsWith(`${prefix}sort`) ||
        key.startsWith(`${prefix}filter_`)
      ) {
        newParams.delete(key);
      }
    });

    Object.entries(serialized).forEach(([key, value]) => {
      newParams.set(key, value);
    });

    const search = newParams.toString();
    const newUrl = search ? `${location.pathname}?${search}` : location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [persistToUrl, pagination, filteredInfo, sortedInfo, tableId, location.search, location.pathname]);

  useEffect(() => {
    if (!persistToUrl) return;
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    const fingerprint = JSON.stringify({
      page: pagination.current,
      pageSize: pagination.pageSize,
      filters: filteredInfo,
      sorts: sortedInfo,
    });

    if (fingerprint === lastSyncedStateRef.current) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    syncTimeoutRef.current = setTimeout(() => {
      syncToUrl();
      lastSyncedStateRef.current = fingerprint;
    }, urlSyncDelay);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [persistToUrl, pagination, filteredInfo, sortedInfo, urlSyncDelay, syncToUrl]);

  const tableParams = useMemo(
    () => ({
      pagination: handlePagination<T>({
        entities,
        total: amount,
        pagination: {
          ...pagination,
          current: pagination.current || currentPage,
          pageSize: pagination.pageSize || pageSize,
          ...DEFAULT_PAGINATION,
        } as TablePaginationConfig,
      }),
      filters: {},
    }),
    [entities, amount, pagination, currentPage, pageSize, DEFAULT_PAGINATION],
  );

  return {
    tableParams: {
      ...tableParams,
      pagination: { ...pagination, total: amount },
    },
    filteredInfo,
    sortedInfo,
    handleTableChange,
    filteredCount: amount,
    computedFilteredCount,
    resetTableState,
  };
};
