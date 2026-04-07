// src/layout/dnd/DndContext.tsx
import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { DragActiveContext } from './DragActiveContext';
import { findNode } from '@/layout/utils/treeUtils';
import { getWidgetDef } from '@/widgets/registry';
import type { EWidgetResource } from '@/lib/types';
import type { WidgetRef, LeafNode } from '@/layout/types';
import styles from './DndContext.module.less';

type ActiveDragData = { type: 'panel' | 'gallery'; widgetRef?: WidgetRef };

function DragPreview({ data }: { data: ActiveDragData }) {
  const resource = data.widgetRef?.resource as EWidgetResource | undefined;
  const label = resource ? (getWidgetDef(resource)?.label ?? resource) : 'Empty';
  return <div className={styles.dragPreview}>{label}</div>;
}

type Props = { children: React.ReactNode };

export function LayoutDndContext({ children }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragData, setActiveDragData] = useState<ActiveDragData | null>(null);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const swapWidgets = useLayoutStore(s => s.swapWidgets);
  const setWidget = useLayoutStore(s => s.setWidget);
  const clearWidget = useLayoutStore(s => s.clearWidget);
  const root = useLayoutStore(s => s.root);

  const dndEnabled = editMode && activeWidgetEditId === null;

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setActiveDragData(active.data.current as ActiveDragData);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    setActiveDragData(null);
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
    <DragActiveContext.Provider value={activeId !== null}>
      <DndContext
        collisionDetection={dndEnabled ? closestCenter : undefined}
        onDragStart={dndEnabled ? onDragStart : undefined}
        onDragEnd={dndEnabled ? onDragEnd : undefined}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeDragData && <DragPreview data={activeDragData} />}
        </DragOverlay>
      </DndContext>
    </DragActiveContext.Provider>
  );
}
