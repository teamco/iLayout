import type { ExtendedColumnType, TColumn, TColumns } from './types';

export function getColumnEffectiveKey<T extends object>(
  item: TColumn<T>,
): string {
  const k = item.key as string;
  if (k) return String(k);

  if ('dataIndex' in item && item.dataIndex !== undefined) {
    const di = item.dataIndex;
    if (Array.isArray(di)) {
      return di.map(String).join(',');
    }
    return String(di);
  }

  return '';
}

export function getColumnLabel<T extends object>(item: TColumn<T>): string {
  const title = (item as Record<string, unknown>).title;
  const fallback = getColumnEffectiveKey(item);

  if (typeof title === 'string' || typeof title === 'number') {
    const titleStr = String(title).trim();
    if (titleStr) return titleStr;
  }

  if (
    title &&
    typeof title === 'object' &&
    'props' in (title as Record<string, unknown>)
  ) {
    const children = (
      title as Record<string, unknown> & { props: Record<string, unknown> }
    ).props?.children;
    if (typeof children === 'string' || typeof children === 'number')
      return String(children);

    if (Array.isArray(children)) {
      const parts = children
        .filter(
          (ch: unknown) => typeof ch === 'string' || typeof ch === 'number',
        )
        .map((ch: unknown) => String(ch).trim())
        .filter(Boolean);
      if (parts.length) return parts.join(' ').trim();
    }
  }

  return fallback;
}

export function filterOutColumns<T extends object>(
  columns: ExtendedColumnType<T>[],
  selectedColumns: Array<TColumns<T>[number]['key']>,
): TColumns<T> {
  return columns.map((item) => ({
    ...item,
    hidden:
      item.concealable &&
      !selectedColumns.includes(
        getColumnEffectiveKey(item as TColumn<T>) as string,
      ),
  })) as TColumns<T>;
}
