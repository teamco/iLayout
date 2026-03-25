// src/layout/dnd/usePanelDnd.ts
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { LeafNode } from '../types';

export function usePanelDnd(node: LeafNode) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: node.id,
    data: { type: 'panel', widgetRef: node.widget },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { type: 'panel', hasWidget: !!node.widget },
  });

  return { attributes, listeners, setDragRef, setDropRef, isDragging, isOver };
}
