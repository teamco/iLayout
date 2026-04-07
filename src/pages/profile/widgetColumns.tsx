import { Button, Dropdown, Tag, Tooltip } from 'antd';
import { LockOutlined, GlobalOutlined, MoreOutlined } from '@ant-design/icons';
import type { TFunction } from 'i18next';
import type { NavigateFn } from '@tanstack/react-router';
import type { MenuProps } from 'antd';
import { subject } from '@casl/ability';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { formatDate } from '@/lib/formatDate';
import type { WidgetRecord } from '@/lib/types';
import type { TColumns } from '@/components/Table/types';
import { columnFilter, type TColumnFilter } from '@/components/Table/filterUtil';
import { columnSorter } from '@/components/Table/sorterUtil';
import type { FilterValue } from 'antd/es/table/interface';

type TFilters = Record<string, FilterValue | null>;
type TSorts = { order?: 'ascend' | 'descend' | null; columnKey?: string };

type WidgetColumnsOptions = {
  t: TFunction;
  navigate: NavigateFn;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<WidgetRecord>) => void;
  entities: WidgetRecord[];
  filteredInfo: TFilters;
  sortedInfo: TSorts;
};

const CATEGORY_COLORS: Record<string, string> = {
  media: 'magenta',
  data: 'cyan',
  content: 'blue',
  embed: 'purple',
  utility: 'orange',
};

const RESOURCE_COLORS: Record<string, string> = {
  youtube: 'red',
  image: 'green',
  iframe: 'purple',
  component: 'blue',
  empty: 'default',
};

export function getWidgetColumns({ t, navigate, onDelete, onUpdate, entities, filteredInfo, sortedInfo }: WidgetColumnsOptions): TColumns<WidgetRecord> {
  return [
    {
      title: t('widget.name'),
      dataIndex: 'name',
      key: 'name',
      filterSearch: true,
      ...(columnFilter(filteredInfo, entities, 'name') as TColumnFilter<WidgetRecord>),
      ...columnSorter(sortedInfo, 'name'),
    },
    {
      title: t('widget.columnCategory'),
      dataIndex: 'category',
      key: 'category',
      width: 110,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'category') as TColumnFilter<WidgetRecord>),
      render: (cat: string) => <Tag color={CATEGORY_COLORS[cat] ?? 'default'}>{cat}</Tag>,
    },
    {
      title: t('widget.columnResource'),
      dataIndex: 'resource',
      key: 'resource',
      width: 110,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'resource') as TColumnFilter<WidgetRecord>),
      render: (res: string) => <Tag color={RESOURCE_COLORS[res] ?? 'default'}>{res}</Tag>,
    },
    {
      title: t('common.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'status') as TColumnFilter<WidgetRecord>),
      render: (status: string) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: t('widget.columnPublic'),
      dataIndex: 'is_public',
      key: 'is_public',
      width: 90,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'is_public', (v) => v ? 'Public' : 'Private') as TColumnFilter<WidgetRecord>),
      render: (isPublic: boolean) => (
        <Tooltip title={isPublic ? t('layout.public') : t('layout.private')}>
          {isPublic ? <GlobalOutlined /> : <LockOutlined />}
        </Tooltip>
      ),
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
      title: t('common.columnCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      concealable: true,
      ...columnSorter(sortedInfo, 'created_at'),
      render: (date: string) => formatDate(date),
    },
    {
      title: t('common.columnActions'),
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: WidgetRecord) => {
        const widgetSubject = subject(ESubject.WIDGET, { kind: ESubject.WIDGET, user_id: record.user_id });
        const items: MenuProps['items'] = [
          { key: 'edit', label: t('common.edit') },
          { key: record.status === 'published' ? 'unpublish' : 'publish', label: record.status === 'published' ? t('layout.unpublish') : t('layout.publish') },
          { key: 'togglePublic', label: record.is_public ? t('layout.private') : t('layout.public') },
          { type: 'divider' },
          { key: 'delete', label: t('common.delete'), danger: true },
        ];

        const handleClick: MenuProps['onClick'] = ({ key }) => {
          if (key === 'edit') {
            void navigate({ to: ERoutes.WIDGET_EDIT as string, params: { widgetId: record.id } });
          } else if (key === 'publish') {
            onUpdate(record.id, { status: 'published' });
          } else if (key === 'unpublish') {
            onUpdate(record.id, { status: 'draft' });
          } else if (key === 'togglePublic') {
            onUpdate(record.id, { is_public: !record.is_public });
          } else if (key === 'delete') {
            onDelete(record.id);
          }
        };

        return (
          <Can I={EAction.EDIT} this={widgetSubject}>
            <Dropdown menu={{ items, onClick: handleClick }} trigger={['click']}>
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Can>
        );
      },
    },
  ] as TColumns<WidgetRecord>;
}
