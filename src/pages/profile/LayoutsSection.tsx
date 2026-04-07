import { useMemo } from 'react';
import { Button, Table } from 'antd';
import { PlusOutlined, LayoutOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth/AuthContext';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { useLayouts, useSetStatus } from '@/lib/hooks/useLayoutQueries';
import type { LayoutRecord } from '@/lib/types';
import { useTable } from '@/lib/hooks/useTable';
import { useColumnsToggle } from '@/lib/hooks/useColumnsToggle';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { HideColumns } from '@/components/Table/HideColumns';
import { TableFooter } from '@/components/Table/TableFooter';
import { PageLayout, PageTitle } from '@/components/PageLayout';
import { getLayoutColumns } from './layoutColumns';

export function LayoutsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: layouts = [], isFetching, refetch } = useLayouts(user?.id);
  const setStatus = useSetStatus();

  const {
    tableParams,
    filteredInfo,
    sortedInfo,
    handleTableChange,
    computedFilteredCount,
  } = useTable(layouts, layouts.length, { persistToUrl: true });

  const columns = useMemo(() => getLayoutColumns({
    t,
    navigate,
    onSetStatus: (args) => setStatus.mutate(args),
    entities: layouts,
    filteredInfo,
    sortedInfo,
  }), [t, navigate, setStatus, layouts, filteredInfo, sortedInfo]);

  const { filteredColumns, columnsList, selectedColumns, setSelectedColumns } = useColumnsToggle(columns, ['created_at']);

  return (
    <PageLayout title={<PageTitle name={t('profile.layouts')} Icon={LayoutOutlined} />} subject={ESubject.LAYOUT}>
      <GridToolbar onRefresh={() => void refetch()} exportData={layouts} exportFileName="layouts">
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
        {columnsList.length > 0 && (
          <HideColumns
            columnsList={columnsList}
            selectedColumns={selectedColumns}
            onChange={setSelectedColumns}
          />
        )}
      </GridToolbar>
      <Table
        dataSource={layouts}
        columns={filteredColumns}
        rowKey={(r) => `${r.id}-${r.version}`}
        loading={isFetching}
        pagination={tableParams.pagination}
        size="small"
        scroll={{ x: 800 }}
        onChange={handleTableChange as Parameters<typeof Table<LayoutRecord>>['0']['onChange']}
        footer={() => <TableFooter computedFilteredCount={computedFilteredCount} totalCount={layouts.length} />}
      />
    </PageLayout>
  );
}
