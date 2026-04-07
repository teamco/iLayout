import React, { useCallback, useRef } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useGridContext } from '@/lib/hooks/useGridContext';
import {
  getHorizontalGridEdges,
  snapToNearestEdge,
} from '@/layout/grid/snapToGrid';

type Props = { sectionId: string };

export function SectionHandle({ sectionId }: Props) {
  const resizeSection = useLayoutStore((s) => s.resizeSection);
  const root = useLayoutStore((s) => s.root);
  const { canvasHeight, rows, rowGutter } = useGridContext();
  const startRef = useRef<{ y: number; height: number } | null>(null);

  const scrollRoot =
    root.type === 'scroll' ? (root as unknown as ScrollRoot) : null;
  const section = scrollRoot?.sections.find((s) => s.id === sectionId);
  const isDisabled = !section || section.height.type === 'auto';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLElement;
      const sectionEl =
        (el.previousElementSibling?.querySelector(
          '[data-section]',
        ) as HTMLElement | null) ??
        (el.previousElementSibling as HTMLElement | null);
      if (!sectionEl) return;
      startRef.current = { y: e.clientY, height: sectionEl.offsetHeight };
      el.setPointerCapture(e.pointerId);
    },
    [isDisabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      const newHeight = Math.max(50, startRef.current.height + dy);
      resizeSection(sectionId, {
        type: 'fixed',
        value: `${Math.round(newHeight)}px`,
      });
    },
    [sectionId, resizeSection],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      let newHeight = Math.max(50, startRef.current.height + dy);
      if (canvasHeight > 0) {
        const edges = getHorizontalGridEdges(canvasHeight, rows, rowGutter);
        newHeight = snapToNearestEdge(newHeight, edges);
      }
      resizeSection(sectionId, {
        type: 'fixed',
        value: `${Math.round(newHeight)}px`,
      });
      startRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [sectionId, resizeSection, canvasHeight, rows, rowGutter],
  );

  return (
    <div
      style={{
        height: 6,
        cursor: isDisabled ? 'default' : 'ns-resize',
        background: isDisabled ? 'transparent' : 'var(--border-dim)',
        opacity: isDisabled ? 0.3 : 0.6,
        transition: 'opacity 0.15s',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
