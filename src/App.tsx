// src/App.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip } from 'antd';
import { AppstoreOutlined, CodeOutlined, SaveOutlined } from '@ant-design/icons';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { AppHeader } from '@/components/AppHeader';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { initAutoSave } from '@/layout/storage/autoSave';
import { localStorageAdapter } from '@/layout/storage/localStorageAdapter';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
import styles from './App.module.less';

const LAYOUT_ID = 'default';

type AppProps = {
  layoutId?: string;
  onSave?: () => void;
  saving?: boolean;
};

export default function App({ layoutId, onSave, saving }: AppProps) {
  const { t } = useTranslation();
  const editMode = useLayoutStore(s => s.editMode);
  const setEditMode = useLayoutStore(s => s.setEditMode);
  const showGrid = useLayoutStore(s => s.showGrid);
  const toggleGrid = useLayoutStore(s => s.toggleGrid);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  // Only use localStorage auto-save when not in Supabase mode
  useEffect(() => {
    if (layoutId) return;
    localStorageAdapter.load(LAYOUT_ID).then(saved => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    return initAutoSave(LAYOUT_ID, localStorageAdapter);
  }, [layoutId]);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, toggleGrid, onSave]);

  return (
    <div className={styles.app}>
      <AppHeader>
        <Tooltip title={t('layout.layoutJson')}>
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={() => setJsonModalOpen(true)}
          />
        </Tooltip>
        <Can I={EAction.EDIT} a={ESubject.LAYOUT}>
          <Button
            type={editMode ? 'primary' : 'default'}
            size="small"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✏️ ' + t('layout.editModeOn') : t('layout.editMode')}
          </Button>
        </Can>
        {editMode && onSave && (
          <Tooltip title={t('common.save') + ' (Ctrl+S)'}>
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={onSave}
            />
          </Tooltip>
        )}
        {editMode && (
          <Tooltip title={t('layout.toggleGrid') + ' (Ctrl+G)'}>
            <Button
              type={showGrid ? 'primary' : 'default'}
              size="small"
              icon={<AppstoreOutlined />}
              onClick={toggleGrid}
            />
          </Tooltip>
        )}
      </AppHeader>
      <div className={styles.canvas}>
        <GridProvider>
          <LayoutRenderer />
          {showGrid && <GridOverlay />}
        </GridProvider>
      </div>
      <LayoutJsonModal open={jsonModalOpen} onClose={() => setJsonModalOpen(false)} />
    </div>
  );
}
