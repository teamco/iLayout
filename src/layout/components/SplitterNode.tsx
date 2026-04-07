// src/layout/components/SplitterNode.tsx
import { useRef } from 'react';
import { Splitter } from 'antd';
import type { SplitterNode } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useGridContext } from '@/lib/hooks/useGridContext';
import { snapToGrid } from '@/layout/grid/snapToGrid';
import { renderNode } from './LayoutRenderer';
import styles from './SplitterNode.module.less';

type Props = { node: SplitterNode };

export function SplitterNodeComponent({ node }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resize = useLayoutStore((s) => s.resize);
  const editMode = useLayoutStore((s) => s.editMode);
  const activeWidgetEditId = useLayoutStore((s) => s.activeWidgetEditId);
  const { canvasWidth, canvasHeight, columns, gutter } = useGridContext();

  const resizingDisabled = !editMode || activeWidgetEditId !== null;

  function toPercentages(pixelSizes: number[], total: number) {
    const percentages = pixelSizes.map((px) => (px / total) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);
    return percentages.map((p) => (p / sum) * 100);
  }

  function getTotal() {
    const container = containerRef.current;
    if (!container) return 0;
    return node.direction === 'horizontal'
      ? container.offsetWidth
      : container.offsetHeight;
  }

  function handleResize(pixelSizes: number[]) {
    const total = getTotal();
    if (total === 0) return;
    resize(node.id, toPercentages(pixelSizes, total));
  }

  function handleResizeEnd(pixelSizes: number[]) {
    if (!editMode) return;
    const container = containerRef.current;
    if (!container) return;
    const total = getTotal();
    if (total === 0) return;

    const canvasSize =
      node.direction === 'horizontal' ? canvasWidth : canvasHeight;
    const rect = container.getBoundingClientRect();
    const canvasEl = container.closest(
      '[data-grid-canvas]',
    ) as HTMLElement | null;
    const canvasRect = canvasEl?.getBoundingClientRect();
    const containerOffset = canvasRect
      ? node.direction === 'horizontal'
        ? rect.left - canvasRect.left
        : rect.top - canvasRect.top
      : 0;
    const snapped = snapToGrid(
      pixelSizes,
      containerOffset,
      canvasSize,
      columns,
      gutter,
    );
    resize(node.id, toPercentages(snapped, total));
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Splitter
        orientation={
          node.direction === 'horizontal' ? 'horizontal' : 'vertical'
        }
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
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
