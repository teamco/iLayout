// src/layout/components/LayoutRenderer.tsx
import React from 'react';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { SplitterNodeComponent } from './SplitterNode';
import { LeafNodeComponent } from './LeafNode';
import type { LayoutNode } from '@/layout/types';
import type { ScrollRoot } from '@/layout/types';
import type { GridRoot } from '@/layout/types';
import { LayoutDndContext } from '@/layout/dnd/DndContext';
import { ScrollLayout } from './ScrollLayout';
import { GridLayout } from './GridLayout';
import styles from './LayoutRenderer.module.less';

// eslint-disable-next-line react-refresh/only-export-components
export function renderNode(node: LayoutNode): React.ReactNode {
  if (node.type === 'splitter')
    return <SplitterNodeComponent key={node.id} node={node} />;
  if (node.type === 'grid')
    return <GridLayout key={node.id} root={node as unknown as GridRoot} />;
  if (node.type === 'scroll')
    return <ScrollLayout key={node.id} root={node} nested />;
  if (node.type === 'section') return renderNode(node.child);
  return <LeafNodeComponent key={node.id} node={node} />;
}

export function LayoutRenderer() {
  const root = useLayoutStore((s) => s.root);
  const layoutMode = useLayoutStore((s) => s.layoutMode);

  return (
    <LayoutDndContext>
      <div className={styles.root}>
        {layoutMode === 'scroll' && root.type === 'scroll' ? (
          <ScrollLayout root={root as unknown as ScrollRoot} />
        ) : layoutMode === 'scroll' && root.type === 'grid' ? (
          <GridLayout root={root as unknown as GridRoot} />
        ) : (
          renderNode(root)
        )}
      </div>
    </LayoutDndContext>
  );
}
