// src/layout/components/LeafNode.tsx
import React, { useState } from 'react';
import { Button } from 'antd';
import type { LeafNode } from '../types';
import type { WidgetRef } from '../types';
import { useLayoutStore } from '../store/layoutStore';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { WidgetGallery } from '../widgets/WidgetGallery';
import { LeafOverlay } from './LeafOverlay';
import { usePanelDnd } from '../dnd/usePanelDnd';

type Props = { node: LeafNode };

export function LeafNodeComponent({ node }: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const setActiveWidgetEdit = useLayoutStore(s => s.setActiveWidgetEdit);
  const setWidget = useLayoutStore(s => s.setWidget);

  const isWidgetEdit = activeWidgetEditId === node.id;
  const isAnyWidgetEdit = activeWidgetEditId !== null;
  const dimmed = isAnyWidgetEdit && !isWidgetEdit;

  const { attributes, listeners, setDragRef, setDropRef, isDragging, isOver } = usePanelDnd(node);

  function handleDoubleClick() {
    if (!editMode) return;
    if (!node.widget) {
      setGalleryOpen(true);
    } else {
      setActiveWidgetEdit(isWidgetEdit ? null : node.id);
    }
  }

  function handleSelectWidget(widget: WidgetRef) {
    setWidget(node.id, widget);
    setGalleryOpen(false);
  }

  function handleDone() {
    setActiveWidgetEdit(null);
  }

  // ESC exits widget edit mode
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
      ref={(el) => { setDragRef(el); setDropRef(el); }}
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        opacity: dimmed ? 0.35 : isDragging ? 0.5 : 1,
        pointerEvents: dimmed ? 'none' : 'auto',
        border: isWidgetEdit ? '2px solid #faad14' : isOver ? '2px solid #52c41a' : undefined,
        boxSizing: 'border-box',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Widget edit toolbar */}
      {isWidgetEdit && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(42,32,16,0.95)', borderBottom: '1px solid #faad14' }}>
          <span style={{ fontSize: 11, color: '#faad14', fontWeight: 600 }}>⚙ Widget Edit</span>
          <div style={{ flex: 1 }} />
          <Button size="small" onClick={() => setGalleryOpen(true)}>Replace</Button>
          <Button size="small" type="primary" onClick={handleDone}>Done</Button>
        </div>
      )}

      {/* Widget content or empty placeholder */}
      {node.widget
        ? <WidgetRenderer widget={node.widget} />
        : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>
            {editMode ? 'Double-click to add widget' : 'Empty'}
          </div>
        )
      }

      {/* Layout edit overlay — shown in layout edit mode when no widget edit is active */}
      {editMode && !isAnyWidgetEdit && (
        <LeafOverlay node={node} dragListeners={listeners} dragAttributes={attributes} />
      )}

      {/* Widget gallery */}
      <WidgetGallery open={galleryOpen} onSelect={handleSelectWidget} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
