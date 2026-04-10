import React, { type JSX } from 'react';
import { Button, Dropdown, type MenuProps } from 'antd';
import {
  MoreOutlined,
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ItemType } from 'antd/es/menu/interface';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import { exportJson } from '@/lib/exportJson';

import styles from './table.module.less';

type GridToolbarProps = {
  children?: React.ReactNode;
  items?: ItemType[];
  onRefresh?: () => void;
  exportData?: unknown;
  exportFileName?: string;
  size?: SizeType;
};

export function GridToolbar(props: GridToolbarProps): JSX.Element {
  const {
    children,
    items = [],
    size = 'middle',
    onRefresh,
    exportData,
    exportFileName = 'export',
  } = props;
  const { t } = useTranslation();

  let baseItems: MenuProps['items'] = [];

  if (onRefresh) {
    baseItems.push({
      key: 'refresh',
      label: t('common.refresh', 'Refresh'),
      icon: <ReloadOutlined />,
      onClick: onRefresh,
    });
  }

  if (exportData) {
    baseItems.push({
      key: 'export',
      label: t('common.exportJson', 'Export JSON'),
      icon: <DownloadOutlined />,
      onClick: () => exportJson(exportData, exportFileName),
    });
  }

  if (items?.length) {
    baseItems = items.concat(
      baseItems.length ? [{ type: 'divider' }, ...baseItems] : [],
    );
  }

  return (
    <div className={styles.gridToolbar}>
      {children ?? null}
      {baseItems.length > 0 && (
        <Dropdown menu={{ items: baseItems }} trigger={['click']}>
          <Button
            size={size}
            color="default"
            variant="filled"
            icon={<MoreOutlined />}
          />
        </Dropdown>
      )}
    </div>
  );
}
