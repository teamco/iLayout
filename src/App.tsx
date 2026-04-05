// src/App.tsx
import { useEffect } from 'react';
import { Button, ConfigProvider, Tooltip, theme } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { initAutoSave } from '@/layout/storage/autoSave';
import { localStorageAdapter } from '@/layout/storage/localStorageAdapter';
import styles from './App.module.less';

const LAYOUT_ID = 'default';

export default function App() {
  const editMode = useLayoutStore(s => s.editMode);
  const setEditMode = useLayoutStore(s => s.setEditMode);
  const showGrid = useLayoutStore(s => s.showGrid);
  const toggleGrid = useLayoutStore(s => s.toggleGrid);

  useEffect(() => {
    localStorageAdapter.load(LAYOUT_ID).then(saved => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    return initAutoSave(LAYOUT_ID, localStorageAdapter);
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, toggleGrid]);

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div className={styles.app}>
        <div className={styles.toolbar}>
          <span className={styles.toolbarTitle}>Widgets</span>
          <div className={styles.toolbarSpacer} />
          <Button
            type={editMode ? 'primary' : 'default'}
            size="small"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
          </Button>
          {editMode && (
            <Tooltip title="Toggle grid (Ctrl+G)">
              <Button
                type={showGrid ? 'primary' : 'default'}
                size="small"
                icon={<AppstoreOutlined />}
                onClick={toggleGrid}
              />
            </Tooltip>
          )}
        </div>
        <div className={styles.canvas}>
          <GridProvider>
            <LayoutRenderer />
            {showGrid && <GridOverlay />}
          </GridProvider>
        </div>
      </div>
    </ConfigProvider>
  );
}
