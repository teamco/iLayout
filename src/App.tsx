// src/App.tsx
import { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import { AppstoreOutlined, CodeOutlined, LogoutOutlined, SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/themes/themeStore';
import { useAuth } from '@/auth/AuthContext';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { initAutoSave } from '@/layout/storage/autoSave';
import { localStorageAdapter } from '@/layout/storage/localStorageAdapter';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
import styles from './App.module.less';

const LAYOUT_ID = 'default';

export default function App() {
  const editMode = useLayoutStore(s => s.editMode);
  const setEditMode = useLayoutStore(s => s.setEditMode);
  const showGrid = useLayoutStore(s => s.showGrid);
  const toggleGrid = useLayoutStore(s => s.toggleGrid);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  const themeMode = useThemeStore(s => s.themeMode);
  const cycleTheme = useThemeStore(s => s.cycleTheme);

  const { signOut } = useAuth();

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
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Widgets</span>
        <div className={styles.toolbarSpacer} />
        <Tooltip title={themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'System'}>
          <Button
            size="small"
            icon={themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <DesktopOutlined />}
            onClick={cycleTheme}
          />
        </Tooltip>
        <Tooltip title="Layout JSON">
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={() => setJsonModalOpen(true)}
          />
        </Tooltip>
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
        <Tooltip title="Sign out">
          <Button
            size="small"
            icon={<LogoutOutlined />}
            onClick={signOut}
          />
        </Tooltip>
      </div>
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
