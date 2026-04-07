import type { FilterValue, Key } from 'antd/es/table/interface';
import { detectType } from './detectType';

type TFilters = Record<string, FilterValue | null>;

type TFilterItem = {
  text: string;
  value: unknown;
};

export type TColumnFilter<T> = {
  filters: TFilterItem[];
  filteredValue: FilterValue | null;
  onFilter: (value: boolean | Key, record: T) => boolean;
};

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

function formatText(value: unknown, type: string, resolver?: (v: unknown) => string): string {
  if (resolver) return resolver(value);

  switch (type) {
    case 'date': {
      const date = new Date(value as string);
      return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
    }
    case 'boolean':
      return String(Boolean(value)).toUpperCase();
    case 'number':
      return isFinite(Number(value)) ? String(Number(value)) : 'NaN';
    case 'string':
      return String(value).trim();
    case 'object':
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

function getUniversalFilters<T>(data: T[], nested: string, resolver?: (v: unknown) => string): TFilterItem[] {
  const seenText = new Set<string>();
  const filters: TFilterItem[] = [];

  for (const item of data) {
    const raw = getByPath(item, nested);
    if (raw === undefined || raw === null) continue;

    const type = detectType(raw);
    const display = formatText(raw, type, resolver);

    if (seenText.has(display)) continue;
    seenText.add(display);

    filters.push({ text: display, value: raw });
  }

  return filters;
}

/**
 * Generates a filter configuration for a table column.
 */
export function columnFilter<T>(
  filteredInfo: TFilters,
  dataSource: T[],
  key: string,
  resolver?: (value: unknown) => string,
): TColumnFilter<T> {
  const filters = getUniversalFilters(dataSource, key, resolver);

  const filteredValue = filteredInfo?.[key]
    ? Array.isArray(filteredInfo[key])
      ? filteredInfo[key]
      : [filteredInfo[key]]
    : null;

  const onFilter = (value: boolean | Key, record: T): boolean => {
    const recordValue = getByPath(record, key);
    if (Array.isArray(recordValue)) {
      return recordValue.includes(value);
    }
    return String(recordValue) === String(value);
  };

  return { filters, filteredValue, onFilter };
}
