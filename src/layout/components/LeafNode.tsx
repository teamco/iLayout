// src/layout/components/LeafNode.tsx
import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { LeafNode } from '@/layout/types';
import type { WidgetRef } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { WidgetRenderer } from '@/layout/widgets/WidgetRenderer';
import { WidgetGallery } from '@/layout/widgets/WidgetGallery';
import { WidgetConfigModal } from '@/layout/widgets/WidgetConfigModal';
import { getWidgetDef } from '@/widgets/registry';
import type { EWidgetResource } from '@/lib/types';
import { LeafOverlay } from './LeafOverlay';
import { usePanelDnd } from '@/layout/dnd/usePanelDnd';
import styles from './LeafNode.module.less';

type Props = { node: LeafNode };

export function LeafNodeComponent({ node }: Props) {
  const [configOpen, setConfigOpen] = useState(false);
  const editMode = useLayoutStore((s) => s.editMode);
  const activeWidgetEditId = useLayoutStore((s) => s.activeWidgetEditId);
  const setActiveWidgetEdit = useLayoutStore((s) => s.setActiveWidgetEdit);
  const galleryTargetId = useLayoutStore((s) => s.galleryTargetId);
  const setGalleryTarget = useLayoutStore((s) => s.setGalleryTarget);
  const setWidget = useLayoutStore((s) => s.setWidget);

  const isWidgetEdit = activeWidgetEditId === node.id;
  const isGalleryTarget = galleryTargetId === node.id;
  const isAnyWidgetEdit = activeWidgetEditId !== null;
  const dimmed = isAnyWidgetEdit && !isWidgetEdit;

  const dndDisabled = !editMode || activeWidgetEditId !== null;
  const { attributes, listeners, setDragRef, setDropRef, isDragging, isOver } =
    usePanelDnd(node, dndDisabled);

  function handleDoubleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (!editMode) return;
    if (!node.widget) {
      setGalleryTarget(node.id);
    } else {
      setActiveWidgetEdit(isWidgetEdit ? null : node.id);
    }
  }

  function handleSelectWidget(widget: WidgetRef) {
    if (galleryTargetId) {
      setWidget(galleryTargetId, widget);
      setGalleryTarget(null);
      // Auto-open config if widget has an editor
      const def = getWidgetDef(widget.resource as EWidgetResource);
      if (def?.editor) {
        setActiveWidgetEdit(galleryTargetId);
        setConfigOpen(true);
      }
    }
  }

  function handleDone() {
    setActiveWidgetEdit(null);
  }

  React.useEffect(() => {
    if (!isWidgetEdit) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setActiveWidgetEdit(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isWidgetEdit, setActiveWidgetEdit]);

  return (
    <div
      ref={(el) => {
        setDragRef(el);
        setDropRef(el);
      }}
      onDoubleClick={handleDoubleClick}
      className={clsx(styles.panel, {
        [styles.dimmed]: dimmed,
        [styles.dragging]: isDragging,
        [styles.widgetEdit]: isWidgetEdit,
        [styles.dropTarget]: isOver,
      })}
    >
      {isWidgetEdit && (
        <div className={styles.editToolbar}>
          <span className={styles.editLabel}>⚙ Widget Edit</span>
          {node.widget?.resource === 'iframe' && (
            <Input
              size="small"
              placeholder="iframe URL"
              defaultValue={String(node.widget.config.url ?? '')}
              className={styles.iframeInput}
              onBlur={(e) => {
                if (node.widget) {
                  setWidget(node.id, {
                    ...node.widget,
                    config: { ...node.widget.config, url: e.target.value },
                  });
                }
              }}
            />
          )}
          <div className={styles.editSpacer} />
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => setConfigOpen(true)}
          >
            Config
          </Button>
          <Button size="small" onClick={() => setGalleryTarget(node.id)}>
            Replace
          </Button>
          <Button size="small" type="primary" onClick={handleDone}>
            Done
          </Button>
        </div>
      )}

      {node.widget ? (
        <WidgetRenderer editMode={editMode} widget={node.widget} />
      ) : (
        <div className={styles.emptyPlaceholder}>
          {editMode ? 'Double-click to add widget' : 'Empty'}
        </div>
      )}

      {editMode && !isAnyWidgetEdit && (
        <LeafOverlay
          node={node}
          dragListeners={listeners}
          dragAttributes={attributes}
        />
      )}

      {/* Gallery: only render on the target leaf */}
      <WidgetGallery
        open={isGalleryTarget}
        onSelect={handleSelectWidget}
        onClose={() => setGalleryTarget(null)}
      />

      {node.widget && (
        <WidgetConfigModal
          open={configOpen}
          widget={node.widget}
          onClose={() => setConfigOpen(false)}
          onChange={(updated) => setWidget(node.id, updated)}
        />
      )}
    </div>
  );
}
