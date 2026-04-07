import React from 'react';
import { Select, type SelectProps } from 'antd';

import type { ISelectItemProps, TColumn } from './types';

type TProps = {
  columnsList: ISelectItemProps[];
  selectedColumns: TColumn['key'][];
  onChange: (value: string[]) => void;
};

/**
 * HideColumns lets users select which columns to show in a table.
 *
 * @example
 * <HideColumns
 *   columnsList={[{ label: 'Name', value: 'name' }, { label: 'Age', value: 'age' }]}
 *   selectedColumns={['name', 'age']}
 *   onChange={(value) => setVisibleColumns(value)}
 * />
 */
export const HideColumns = (props: TProps): React.JSX.Element => {
  const { selectedColumns = [], columnsList = [], onChange } = props;

  if (!columnsList?.length) {
    return <></>;
  }

  const placeholder = 'Select columns to show';

  const sharedProps: SelectProps = {
    mode: 'multiple',
    style: { minWidth: 180 },
    options: [
      {
        label: <span>{placeholder}</span>,
        title: placeholder,
        options: columnsList,
      },
    ],
    placeholder,
    maxTagCount: 'responsive',
  };

  /**
   * Prevents deselecting all columns — at least one must remain visible.
   */
  const handleChange = (values: string[]): void => {
    if (values.length < 1) return;
    onChange?.(values);
  };

  const selectProps: SelectProps = {
    value: selectedColumns,
    onChange: handleChange,
  };

  return <Select {...sharedProps} {...selectProps} style={{ width: 250 }} />;
};
