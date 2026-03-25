// src/App.tsx
import React, { useEffect } from 'react';
import { ConfigProvider, Button, theme } from 'antd';
import { LayoutRenderer } from './layout/components/LayoutRenderer';
import { useLayoutStore } from './layout/store/layoutStore';
import { initAutoSave } from './layout/storage/autoSave';
import { localStorageAdapter } from './layout/storage/localStorageAdapter';

const LAYOUT_ID = 'default';

export default function App() {
  const editMode = useLayoutStore(s => s.editMode);
  const setEditMode = useLayoutStore(s => s.setEditMode);

  useEffect(() => {
    // Load saved layout on mount
    localStorageAdapter.load(LAYOUT_ID).then(saved => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    // Start auto-save (debounced 1s)
    const unsub = initAutoSave(LAYOUT_ID, localStorageAdapter);
    return unsub;
  }, []);

  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#0d0d0d' }}>
        {/* Toolbar */}
        <div style={{ height: 44, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, borderBottom: '1px solid #222', flexShrink: 0 }}>
          <span style={{ fontWeight: 600, color: '#fff', fontSize: 14 }}>Widgets</span>
          <div style={{ flex: 1 }} />
          <Button
            type={editMode ? 'primary' : 'default'}
            size="small"
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
          </Button>
        </div>

        {/* Layout canvas */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <LayoutRenderer />
        </div>
      </div>
    </ConfigProvider>
  );
}
