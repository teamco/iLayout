// src/layout/dnd/DndContext.tsx
import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useLayoutStore } from '../store/layoutStore';
import { findNode } from '../utils/treeUtils';
import type { WidgetRef, LeafNode } from '../types';

type Props = { children: React.ReactNode };

export function LayoutDndContext({ children }: Props) {
  const [, setActiveId] = useState<string | null>(null);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const swapWidgets = useLayoutStore(s => s.swapWidgets);
  const setWidget = useLayoutStore(s => s.setWidget);
  const clearWidget = useLayoutStore(s => s.clearWidget);
  const root = useLayoutStore(s => s.root);

  const dndEnabled = editMode && activeWidgetEditId === null;

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const sourceId = String(active.id);
    const targetId = String(over.id);

    const sourceData = active.data.current as { type: 'panel' | 'gallery'; widgetRef?: unknown };
    const targetData = over.data.current as { type: 'panel'; hasWidget: boolean };

    if (sourceData?.type === 'gallery') {
      setWidget(targetId, sourceData.widgetRef as WidgetRef);
    } else {
      if (targetData?.hasWidget) {
        swapWidgets(sourceId, targetId);
      } else {
        const sourceNode = findNode(root, sourceId)?.node as LeafNode | undefined;
        if (sourceNode?.widget) {
          setWidget(targetId, sourceNode.widget);
          clearWidget(sourceId);
        }
      }
    }
  }

  return (
    <DndContext
      collisionDetection={dndEnabled ? closestCenter : undefined}
      onDragStart={dndEnabled ? onDragStart : undefined}
      onDragEnd={dndEnabled ? onDragEnd : undefined}
    >
      {children}
    </DndContext>
  );
}
