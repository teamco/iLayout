// src/layout/components/LeafNode.tsx
import React, { useState, useRef, useCallback } from 'react';
import { Button, Input } from 'antd';
import type { LeafNode } from '../types';
import type { WidgetRef } from '../types';
import { useLayoutStore } from '../store/layoutStore';
import { WidgetRenderer } from '../widgets/WidgetRenderer';
import { WidgetGallery } from '../widgets/WidgetGallery';
import { LeafOverlay } from './LeafOverlay';
import { usePanelDnd } from '../dnd/usePanelDnd';
import { findNode } from '../utils/treeUtils';

type Props = { node: LeafNode };

function ResizeHandle({ nodeId }: { nodeId: string }) {
  const setWidget = useLayoutStore(s => s.setWidget);
  const root = useLayoutStore(s => s.root);
  const startPos = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const containerRef = useRef<Element | null>(null);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const found = findNode(root, nodeId);
    if (!found) return;
    const node = found.node as LeafNode;
    if (!node.widget) return;
    const container = (e.currentTarget as HTMLElement).parentElement?.parentElement;
    if (!container) return;
    containerRef.current = container;
    const rect = container.getBoundingClientRect();
    startPos.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height };

    function onMouseMove(ev: MouseEvent) {
      if (!startPos.current || !containerRef.current) return;
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      const newW = Math.max(50, startPos.current.w + dx);
      const newH = Math.max(50, startPos.current.h + dy);
      setWidget(nodeId, {
        ...node.widget!,
        bounds: { ...(node.widget!.bounds ?? {}), width: newW, height: newH },
      });
    }

    function onMouseUp() {
      startPos.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [root, nodeId, setWidget]);

  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: 12,
        height: 12,
        borderRight: '2px solid #faad14',
        borderBottom: '2px solid #faad14',
        cursor: 'se-resize',
        zIndex: 25,
      }}
    />
  );
}

export function LeafNodeComponent({ node }: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const setActiveWidgetEdit = useLayoutStore(s => s.setActiveWidgetEdit);
  const setWidget = useLayoutStore(s => s.setWidget);

  const isWidgetEdit = activeWidgetEditId === node.id;
  const isAnyWidgetEdit = activeWidgetEditId !== null;
  const dimmed = isAnyWidgetEdit && !isWidgetEdit;

  const dndDisabled = !editMode || activeWidgetEditId !== null;
  const { attributes, listeners, setDragRef, setDropRef, isDragging, isOver } = usePanelDnd(node, dndDisabled);

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
        background: isOver ? 'rgba(82,196,26,0.15)' : undefined,
        boxSizing: 'border-box',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Widget edit toolbar */}
      {isWidgetEdit && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px', background: 'rgba(42,32,16,0.95)', borderBottom: '1px solid #faad14' }}>
          <span style={{ fontSize: 11, color: '#faad14', fontWeight: 600 }}>⚙ Widget Edit</span>
          {node.widget?.type === 'iframe' && (
            <Input
              size="small"
              placeholder="iframe URL"
              defaultValue={String(node.widget.config.url ?? '')}
              style={{ width: 200 }}
              onBlur={e => {
                if (node.widget) {
                  setWidget(node.id, { ...node.widget, config: { ...node.widget.config, url: e.target.value } });
                }
              }}
            />
          )}
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

      {/* Widget bounds resize handle */}
      {isWidgetEdit && node.widget && <ResizeHandle nodeId={node.id} />}

      {/* Widget gallery */}
      <WidgetGallery open={galleryOpen} onSelect={handleSelectWidget} onClose={() => setGalleryOpen(false)} />
    </div>
  );
}
