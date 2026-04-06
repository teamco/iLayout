import { Button, Popconfirm, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { subject } from '@casl/ability';
import { useAuth } from '@/auth/AuthContext';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { useLayouts, useSetStatus } from '@/lib/hooks/useLayoutQueries';
import { formatDate } from '@/lib/formatDate';
import type { LayoutRecord } from '@/lib/types';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { TableFooter } from '@/components/Table/TableFooter';
import { PageLayout, PageTitle } from '@/components/PageLayout';
import { LayoutOutlined } from '@ant-design/icons';

export function LayoutsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: layouts, isLoading } = useLayouts(user?.id);
  const setStatus = useSetStatus();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Typography.Text copyable style={{ fontSize: 12 }}>{id.slice(0, 8)}</Typography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'published' ? 'green' : status === 'draft' ? 'blue' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
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
                  onClick={() => setStatus.mutate({ id: record.id, version: record.version, status: 'published' })}
                >
                  {t('layout.publish')}
                </Button>
              )}
              {record.status === 'published' && (
                <Button
                  size="small"
                  onClick={() => setStatus.mutate({ id: record.id, version: record.version, status: 'draft' })}
                >
                  {t('layout.unpublish')}
                </Button>
              )}
            </Can>
            <Can I={EAction.DELETE} this={layoutSubject}>
              <Popconfirm
                title={t('layout.deleteConfirm')}
                onConfirm={() => setStatus.mutate({ id: record.id, version: record.version, status: 'deleted' })}
              >
                <Button size="small" danger>{t('common.delete')}</Button>
              </Popconfirm>
            </Can>
          </span>
        );
      },
    },
  ];

  return (
    <PageLayout title={<PageTitle name={t('profile.layouts')} Icon={LayoutOutlined} />} subject={ESubject.LAYOUT}>
      <GridToolbar>
        <Can I={EAction.CREATE} a={ESubject.LAYOUT}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => void navigate({
              to: ERoutes.LAYOUT_NEW as string,
            })}
          >
            {t('layout.newLayout')}
          </Button>
        </Can>
      </GridToolbar>
      <Table
        dataSource={layouts ?? []}
        columns={columns}
        rowKey={(r) => `${r.id}-${r.version}`}
        loading={isLoading}
        pagination={false}
        size="small"
        footer={() => <TableFooter computedFilteredCount={layouts?.length ?? 0} totalCount={layouts?.length ?? 0} />}
      />
    </PageLayout>
  );
}
