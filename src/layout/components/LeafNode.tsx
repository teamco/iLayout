// src/layout/components/LeafNode.tsx
import React from 'react';
import type { LeafNode } from '../types';
import { useLayoutStore } from '../store/layoutStore';
import { WidgetRenderer } from '../widgets/WidgetRenderer';

type Props = { node: LeafNode };

export function LeafNodeComponent({ node }: Props) {
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const setActiveWidgetEdit = useLayoutStore(s => s.setActiveWidgetEdit);

  const isWidgetEdit = activeWidgetEditId === node.id;
  const isAnyWidgetEdit = activeWidgetEditId !== null;
  const dimmed = isAnyWidgetEdit && !isWidgetEdit;

  function handleDoubleClick() {
    if (!editMode) return;
    setActiveWidgetEdit(isWidgetEdit ? null : node.id);
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        opacity: dimmed ? 0.35 : 1,
        pointerEvents: dimmed ? 'none' : 'auto',
        border: isWidgetEdit ? '2px solid #faad14' : undefined,
        boxSizing: 'border-box',
        transition: 'opacity 0.15s',
      }}
    >
      {node.widget
        ? <WidgetRenderer widget={node.widget} />
        : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 12 }}>
            {editMode ? 'Double-click to add widget' : 'Empty'}
          </div>
        )
      }
      {/* Overlay and gallery added in Tasks 9 & 10 */}
    </div>
  );
}
