// src/layout/components/GridColumnHandle.tsx
import React, { useCallback, useRef } from 'react';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = {
  leftColumnId: string;
  rightColumnId: string;
};

export function GridColumnHandle({ leftColumnId, rightColumnId }: Props) {
  const resizeGridColumn = useLayoutStore((s) => s.resizeGridColumn);
  const startRef = useRef<{
    x: number;
    leftWidth: number;
    rightWidth: number;
  } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget as HTMLElement;
    const column = el.parentElement;
    const nextColumn = column?.nextElementSibling as HTMLElement | null;
    if (!column || !nextColumn) return;

    startRef.current = {
      x: e.clientX,
      leftWidth: column.offsetWidth,
      rightWidth: nextColumn.offsetWidth,
    };
    el.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const MIN_WIDTH = 50;

      const newLeft = Math.max(MIN_WIDTH, startRef.current.leftWidth + dx);
      const newRight = Math.max(MIN_WIDTH, startRef.current.rightWidth - dx);

      resizeGridColumn(leftColumnId, `${Math.round(newLeft)}px`);
      resizeGridColumn(rightColumnId, `${Math.round(newRight)}px`);
    },
    [leftColumnId, rightColumnId, resizeGridColumn],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    startRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: 6,
        height: '100%',
        cursor: 'col-resize',
        background: 'var(--border-dim)',
        opacity: 0.6,
        transition: 'opacity 0.15s',
        touchAction: 'none',
        zIndex: 10,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
