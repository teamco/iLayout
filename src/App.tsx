// src/App.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  CodeOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { AppHeader } from '@/components/AppHeader';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
import { AddPanelModal } from '@/layout/components/AddPanelModal';
import type { SplitDirection } from '@/layout/types';
import styles from './App.module.less';

type AppProps = {
  onSave?: () => void;
  saving?: boolean;
};

export default function App({ onSave, saving }: AppProps) {
  const { t } = useTranslation();
  const editMode = useLayoutStore((s) => s.editMode);
  const setEditMode = useLayoutStore((s) => s.setEditMode);
  const showGrid = useLayoutStore((s) => s.showGrid);
  const toggleGrid = useLayoutStore((s) => s.toggleGrid);
  const layoutMode = useLayoutStore((s) => s.layoutMode);
  const activeWidgetEditId = useLayoutStore((s) => s.activeWidgetEditId);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);
  const [addSectionModalOpen, setAddSectionModalOpen] = useState(false);

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
        {editMode && layoutMode === 'scroll' && (
          <Tooltip title={t('layout.addSection')}>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setAddSectionModalOpen(true)}
            />
          </Tooltip>
        )}
        <Can I={EAction.EDIT} a={ESubject.LAYOUT}>
          <Button
            type={editMode ? 'primary' : 'default'}
            size="small"
            disabled={activeWidgetEditId !== null}
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
      <div
        className={styles.canvas}
        style={layoutMode === 'scroll' ? { overflowY: 'auto' } : undefined}
      >
        <GridProvider>
          <LayoutRenderer />
          {showGrid && <GridOverlay />}
        </GridProvider>
      </div>
      <LayoutJsonModal
        open={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
      />
      <AddPanelModal
        open={addSectionModalOpen}
        onCancel={() => setAddSectionModalOpen(false)}
        onSelect={async (dir: SplitDirection) => {
          setAddSectionModalOpen(false);

          if (dir === 'left' || dir === 'right') {
            // Horizontal: wrap entire root in horizontal splitter
            const { nanoid } = await import('nanoid');
            const currentRoot = useLayoutStore.getState().root;
            const newLeaf = { id: nanoid(), type: 'leaf' as const };
            const after = dir === 'right';
            useLayoutStore.setState({
              root: {
                id: nanoid(),
                type: 'splitter' as const,
                direction: 'horizontal' as const,
                sizes: after ? [80, 20] : [20, 80],
                children: after
                  ? [currentRoot, newLeaf]
                  : [newLeaf, currentRoot],
              },
            });
          } else {
            // Vertical: add section (page grows, scrollable)
            // Ensure scroll mode
            if (useLayoutStore.getState().root.type !== 'scroll') {
              useLayoutStore.getState().setLayoutMode('scroll');
            }
            const root = useLayoutStore.getState().root;
            if (root.type === 'scroll') {
              const sr = root as unknown as import('@/layout/types').ScrollRoot;
              const targetId =
                dir === 'top'
                  ? sr.sections[0]?.id
                  : sr.sections[sr.sections.length - 1]?.id;
              if (targetId)
                useLayoutStore
                  .getState()
                  .addSection(dir === 'top' ? 'before' : 'after', targetId);
            }
          }
        }}
      />
    </div>
  );
}
