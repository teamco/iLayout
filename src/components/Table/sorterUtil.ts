import dayjs from 'dayjs';
import type { SorterResult } from 'antd/es/table/interface';
import { detectType } from './detectType';

type TSorts = {
  order?: 'ascend' | 'descend' | null;
  columnKey?: string;
};

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object')
      return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function dateSort(dateA: string, dateB: string): number {
  return dayjs(dateA).diff(dayjs(dateB));
}

function defaultSort(a: number | string, b: number | string): number {
  if (a < b) return -1;
  if (b < a) return 1;
  return 0;
}

function nestedSort(paths: string[], resolver?: (v: unknown) => unknown) {
  return (a: unknown, b: unknown) => {
    let valA: unknown;
    let valB: unknown;

    for (const path of paths) {
      valA = getByPath(a, path);
      if (valA !== undefined) break;
    }
    for (const path of paths) {
      valB = getByPath(b, path);
      if (valB !== undefined) break;
    }

    if (resolver) {
      valA = resolver(valA);
      valB = resolver(valB);
    }

    const type = detectType(valA);

    if (type === 'date') return dateSort(valA as string, valB as string);
    return defaultSort(valA as number | string, valB as number | string);
  };
}

export type TSorter = {
  sorter: ReturnType<typeof nestedSort>;
  sortOrder?: SorterResult<unknown>['order'] | null;
  defaultSortOrder?: 'ascend' | 'descend';
};

/**
 * Creates a sorter configuration for a table column.
 */
export function columnSorter(
  sortedInfo: TSorts,
  sorterKey: string,
  orderKey?: string,
  resolver?: (v: unknown) => unknown,
  defaultSortOrder?: 'ascend' | 'descend',
): TSorter {
  const key = orderKey ?? sorterKey;

  return {
    sorter: nestedSort([sorterKey], resolver),
    ...(sortedInfo?.columnKey === key ? { sortOrder: sortedInfo.order } : {}),
    ...(defaultSortOrder ? { defaultSortOrder } : {}),
  };
}
