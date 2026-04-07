// src/layout/components/LayoutRenderer.tsx
import React from 'react';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { SplitterNodeComponent } from './SplitterNode';
import { LeafNodeComponent } from './LeafNode';
import type { LayoutNode } from '@/layout/types';
import { LayoutDndContext } from '@/layout/dnd/DndContext';
import styles from './LayoutRenderer.module.less';

// eslint-disable-next-line react-refresh/only-export-components
export function renderNode(node: LayoutNode): React.ReactNode {
  if (node.type === 'splitter') return <SplitterNodeComponent key={node.id} node={node} />;
  return <LeafNodeComponent key={node.id} node={node} />;
}

export function LayoutRenderer() {
  const root = useLayoutStore(s => s.root);
  return (
    <LayoutDndContext>
      <div className={styles.root}>{renderNode(root)}</div>
    </LayoutDndContext>
  );
}
