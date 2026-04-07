import { useMemo } from 'react';
import { Button, Table } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth/AuthContext';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { useWidgets, useUpdateWidget, useDeleteWidget } from '@/lib/hooks/useWidgetQueries';
import type { WidgetRecord } from '@/lib/types';
import { useTable } from '@/lib/hooks/useTable';
import { useColumnsToggle } from '@/lib/hooks/useColumnsToggle';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { HideColumns } from '@/components/Table/HideColumns';
import { TableFooter } from '@/components/Table/TableFooter';
import { PageLayout, PageTitle } from '@/components/PageLayout';
import { getWidgetColumns } from './widgetColumns';

export function WidgetsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: widgets = [], isFetching, refetch } = useWidgets(user?.id);
  const updateWidget = useUpdateWidget();
  const deleteWidget = useDeleteWidget();

  const {
    tableParams,
    filteredInfo,
    sortedInfo,
    handleTableChange,
    computedFilteredCount,
  } = useTable(widgets, widgets.length, { persistToUrl: true });

  const columns = useMemo(() => getWidgetColumns({
    t,
    navigate,
    onDelete: (id) => deleteWidget.mutate(id),
    onUpdate: (id, data) => updateWidget.mutate({ id, data }),
    entities: widgets,
    filteredInfo,
    sortedInfo,
  }), [t, navigate, deleteWidget, updateWidget, widgets, filteredInfo, sortedInfo]);

  const { filteredColumns, columnsList, selectedColumns, setSelectedColumns } = useColumnsToggle(columns, ['created_at']);

  return (
    <PageLayout title={<PageTitle name={t('profile.widgets')} Icon={AppstoreOutlined} />} subject={ESubject.WIDGET}>
      <GridToolbar onRefresh={() => void refetch()} exportData={widgets} exportFileName="widgets">
        <Can I={EAction.CREATE} a={ESubject.WIDGET}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => void navigate({ to: ERoutes.WIDGET_NEW as string })}
          >
            {t('widget.newWidget')}
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
        dataSource={widgets}
        columns={filteredColumns}
        rowKey="id"
        loading={isFetching}
        pagination={tableParams.pagination}
        size="small"
        scroll={{ x: 800 }}
        onChange={handleTableChange as Parameters<typeof Table<WidgetRecord>>['0']['onChange']}
        footer={() => <TableFooter computedFilteredCount={computedFilteredCount} totalCount={widgets.length} />}
      />
    </PageLayout>
  );
}
