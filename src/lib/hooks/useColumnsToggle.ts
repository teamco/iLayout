import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  ISelectItemProps,
  TColumn,
  TColumns,
} from '@/components/Table/types';
import {
  filterOutColumns,
  getColumnEffectiveKey,
  getColumnLabel,
} from '@/components/Table/columnUtils';

/**
 * Custom hook to manage and filter columns in a table.
 *
 * @param columns - Array of column objects to be processed.
 * @param hiddenByDefault - Array of column keys to hide by default.
 */
export function useColumnsToggle<T extends object>(
  columns: TColumns<T>,
  hiddenByDefault: Array<TColumn<T>['key']> = [],
) {
  const columnsList = useMemo<ISelectItemProps[]>(() => {
    return columns
      .filter((col: TColumn<T>) => col.concealable)
      .map((col: TColumn<T>) => ({
        label: getColumnLabel<T>(col),
        value: getColumnEffectiveKey<T>(col),
      }));
  }, [columns]);

  const concealableKeys = useMemo<string[]>(
    () => columnsList.map((c) => c.value),
    [columnsList],
  );
  const [selectedColumns, setSelectedColumns] = useState<string[]>(() => {
    const hidden = new Set(hiddenByDefault.map(String));
    return concealableKeys.filter((key) => !hidden.has(key));
  });

  const prevKeysRef = useRef<string[]>(concealableKeys);

  // Handle dynamic column changes (columns being added/removed)
  useEffect(() => {
    const prev = prevKeysRef.current;
    const keys = concealableKeys;
    const prevSet = new Set(prev);
    const keysSet = new Set(keys);

    const changed =
      prev.length !== keys.length ||
      keys.some((k) => !prevSet.has(k)) ||
      prev.some((k) => !keysSet.has(k));

    if (changed) {
      const addedKeys = keys.filter((k) => !prevSet.has(k));

      setSelectedColumns((sel) => {
        const next = sel.filter((v) => keysSet.has(String(v)));

        for (const k of addedKeys) {
          const isHiddenByDefault = hiddenByDefault.map(String).includes(k);
          if (!isHiddenByDefault && !next.includes(k)) {
            next.push(k);
          }
        }
        return next;
      });

      prevKeysRef.current = keys;
    }
  }, [concealableKeys, hiddenByDefault]);

  const filteredColumns = useMemo<TColumns<T>>(() => {
    return filterOutColumns(columns, selectedColumns) as TColumns<T>;
  }, [columns, selectedColumns]);

  return {
    columnsList,
    selectedColumns,
    setSelectedColumns,
    filteredColumns,
  };
}
