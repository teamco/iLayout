import type { ColumnGroupType, ColumnType, SorterResult, TablePaginationConfig } from 'antd/es/table/interface';
import type { GetProp, TableProps } from 'antd';

export interface ITableParams {
  pagination?: TablePaginationConfig;
  sortField?: SorterResult<unknown>['field'];
  sortOrder?: SorterResult<unknown>['order'];
  filters?: Parameters<GetProp<TableProps, 'onChange'>>[1];
  scroll?: { x?: number | 'max-content' | 'fit-content'; y?: number | string };
  footer?: TableProps<unknown>['footer'];
}

export const EAntSort = {
  ASC: 'ascend',
  DESC: 'descend',
} as const;
export type EAntSort = (typeof EAntSort)[keyof typeof EAntSort];

export type ExtendedColumnType<T> = ColumnType<T> & {
  concealable?: boolean;
  hidden?: boolean | undefined;
};

export type ExtendedColumnGroupType<T> = ColumnGroupType<T> & {
  concealable?: boolean;
  hidden?: boolean | undefined;
  dataIndex?: string;
};

export type TColumn<T extends object = object> = {
  key?: string;
  filterBy?: {
    resolver?: (value: unknown) => unknown;
  };
} & (ExtendedColumnType<T> | ExtendedColumnGroupType<T>);

export type TColumns<T extends object = object> = Array<TColumn<T>> & TableProps<T>['columns'];

export interface ISelectItemProps {
  label: string;
  value: string;
  disabled?: boolean;
}
