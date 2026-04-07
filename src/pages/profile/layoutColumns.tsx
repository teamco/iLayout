import { Button, Popconfirm, Tag, Tooltip, Typography } from 'antd';
import { LockOutlined, GlobalOutlined } from '@ant-design/icons';
import type { TColumns } from '@/components/Table/types';
import type { TFunction } from 'i18next';
import type { NavigateFn } from '@tanstack/react-router';
import { subject } from '@casl/ability';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { formatDate } from '@/lib/formatDate';
import type { LayoutRecord, LayoutStatus } from '@/lib/types';
import { columnFilter, type TColumnFilter } from '@/components/Table/filterUtil';
import { columnSorter } from '@/components/Table/sorterUtil';
import type { FilterValue } from 'antd/es/table/interface';

type TFilters = Record<string, FilterValue | null>;
type TSorts = {
  order?: 'ascend' | 'descend' | null;
  columnKey?: string;
};

type LayoutColumnsOptions = {
  t: TFunction;
  navigate: NavigateFn;
  onSetStatus: (args: { id: string; version: number; status: LayoutStatus }) => void;
  entities: LayoutRecord[];
  filteredInfo: TFilters;
  sortedInfo: TSorts;
};

export function getLayoutColumns({ t, navigate, onSetStatus, entities, filteredInfo, sortedInfo }: LayoutColumnsOptions): TColumns<LayoutRecord> {
  return [
    {
      title: t('common.columnId'),
      dataIndex: 'id',
      key: 'id',
      filterSearch: true,
      ...(columnFilter(filteredInfo, entities, 'id', (v) => String(v).slice(0, 8)) as TColumnFilter<LayoutRecord>),
      ...columnSorter(sortedInfo, 'id'),
      render: (id: string) => (
        <Typography.Text copyable style={{ fontSize: 12 }}>{id.slice(0, 8)}</Typography.Text>
      ),
    },
    {
      title: t('layout.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'status') as TColumnFilter<LayoutRecord>),
      ...columnSorter(sortedInfo, 'status'),
      render: (status: string) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: t('layout.columnMode', 'Mode'),
      dataIndex: 'mode',
      key: 'mode',
      width: 100,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'mode') as TColumnFilter<LayoutRecord>),
      render: (mode: string) => {
        const color = mode === 'scroll' ? 'purple' : 'cyan';
        return <Tag color={color}>{mode}</Tag>;
      },
    },
    {
      title: t('layout.columnVersion'),
      dataIndex: 'version',
      key: 'version',
      width: 100,
      concealable: true,
      ...columnSorter(sortedInfo, 'version'),
    },
    {
      title: t('layout.columnPrivate', 'Private'),
      dataIndex: 'is_private',
      key: 'is_private',
      width: 110,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'is_private', (v) => v ? 'Private' : 'Public') as TColumnFilter<LayoutRecord>),
      ...columnSorter(sortedInfo, 'is_private'),
      render: (isPrivate: boolean) => (
        <Tooltip title={isPrivate ? t('layout.private', 'Private') : t('layout.public', 'Public')}>
          {isPrivate ? <LockOutlined /> : <GlobalOutlined />}
        </Tooltip>
      ),
    },
    {
      title: t('common.columnCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      concealable: true,
      ...columnSorter(sortedInfo, 'created_at'),
      render: (date: string) => formatDate(date),
    },
    {
      title: t('common.columnUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      concealable: true,
      ...columnSorter(sortedInfo, 'updated_at'),
      render: (date: string) => formatDate(date),
    },
    {
      title: t('common.columnActions'),
      key: 'actions',
      width: 250,
      fixed: 'right' as const,
      render: (_: unknown, record: LayoutRecord) => {
        const layoutSubject = subject(ESubject.LAYOUT, { kind: ESubject.LAYOUT, user_id: record.user_id });
        return (
          <span style={{ display: 'flex', gap: 8 }}>
            <Can I={EAction.EDIT} this={layoutSubject}>
              <Button
                size="small"
                onClick={() => void navigate({
                  to: ERoutes.LAYOUT_EDIT as string,
                  params: { layoutId: record.id },
                })}
              >
                {t('common.edit')}
              </Button>
            </Can>
            <Can I={EAction.PUBLISH} this={layoutSubject}>
              {record.status === 'draft' && (
                <Button
                  size="small"
                  onClick={() => onSetStatus({ id: record.id, version: record.version, status: 'published' })}
                >
                  {t('layout.publish')}
                </Button>
              )}
              {record.status === 'published' && (
                <Button
                  size="small"
                  onClick={() => onSetStatus({ id: record.id, version: record.version, status: 'draft' })}
                >
                  {t('layout.unpublish')}
                </Button>
              )}
            </Can>
            <Can I={EAction.DELETE} this={layoutSubject}>
              <Popconfirm
                title={t('layout.deleteConfirm')}
                onConfirm={() => onSetStatus({ id: record.id, version: record.version, status: 'deleted' })}
              >
                <Button size="small" danger>{t('common.delete')}</Button>
              </Popconfirm>
            </Can>
          </span>
        );
      },
    },
  ] as TColumns<LayoutRecord>;
}
