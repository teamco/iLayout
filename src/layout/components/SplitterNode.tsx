// src/layout/components/SplitterNode.tsx
import React, { useRef } from 'react';
import { Splitter } from 'antd';
import type { SplitterNode } from '../types';
import { useLayoutStore } from '../store/layoutStore';
import { renderNode } from './LayoutRenderer';

type Props = { node: SplitterNode };

export function SplitterNodeComponent({ node }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const resize = useLayoutStore(s => s.resize);
  const editMode = useLayoutStore(s => s.editMode);
  const activeWidgetEditId = useLayoutStore(s => s.activeWidgetEditId);

  const resizingDisabled = !editMode || activeWidgetEditId !== null;

  function handleResize(pixelSizes: number[]) {
    const container = containerRef.current;
    if (!container) return;
    const total = node.direction === 'horizontal'
      ? container.offsetWidth
      : container.offsetHeight;
    if (total === 0) return;
    const percentages = pixelSizes.map(px => (px / total) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);
    const normalized = percentages.map(p => (p / sum) * 100);
    resize(node.id, normalized);
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <Splitter
        layout={node.direction === 'horizontal' ? 'horizontal' : 'vertical'}
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
