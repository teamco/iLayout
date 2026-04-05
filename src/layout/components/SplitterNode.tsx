// src/layout/components/SplitterNode.tsx
import { useRef } from 'react';
import { Splitter } from 'antd';
import type { SplitterNode } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useGridContext } from '@/layout/grid/GridContext';
import { snapToGrid } from '@/layout/grid/snapToGrid';
import { renderNode } from './LayoutRenderer';
import styles from './SplitterNode.module.less';

type Props = { node: SplitterNode };

export function SplitterNodeComponent({ node }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resize = useLayoutStore(s => s.resize);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);
  const { canvasWidth, canvasHeight, columns, gutter } = useGridContext();

  const resizingDisabled = !editMode || activeWidgetEditId !== null;

  function handleResize(pixelSizes: number[]) {
    const container = containerRef.current;
    if (!container) return;
    const total = node.direction === 'horizontal'
      ? container.offsetWidth
      : container.offsetHeight;
    if (total === 0) return;

    let sizes = pixelSizes;
    if (editMode) {
      const canvasSize = node.direction === 'horizontal' ? canvasWidth : canvasHeight;
      const rect = container.getBoundingClientRect();
      const canvasEl = container.closest('[data-grid-canvas]') as HTMLElement | null;
      const canvasRect = canvasEl?.getBoundingClientRect();
      const containerOffset = canvasRect
        ? (node.direction === 'horizontal' ? rect.left - canvasRect.left : rect.top - canvasRect.top)
        : 0;
      sizes = snapToGrid(pixelSizes, containerOffset, canvasSize, columns, gutter);
    }

    const percentages = sizes.map(px => (px / total) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);
    const normalized = percentages.map(p => (p / sum) * 100);
    resize(node.id, normalized);
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Splitter
        orientation={node.direction === 'horizontal' ? 'horizontal' : 'vertical'}
        onResize={handleResize}
      >
        {node.children.map((child, i) => (
          <Splitter.Panel
            key={child.id}
            size={`${node.sizes[i]}%`}
            resizable={!resizingDisabled}
          >
            {renderNode(child)}
          </Splitter.Panel>
        ))}
      </Splitter>
    </div>
  );
}
