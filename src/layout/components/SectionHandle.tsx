import React, { useCallback, useRef } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useGridContext } from '@/lib/hooks/useGridContext';
import {
  getHorizontalGridEdges,
  snapToNearestEdge,
} from '@/layout/grid/snapToGrid';

type Props = {
  aboveSectionId: string;
  belowSectionId?: string;
};

export function SectionHandle({ aboveSectionId, belowSectionId }: Props) {
  const resizeSection = useLayoutStore((s) => s.resizeSection);
  const root = useLayoutStore((s) => s.root);
  const { canvasHeight, rows, rowGutter } = useGridContext();
  const startRef = useRef<{
    y: number;
    aboveHeight: number;
    belowHeight: number;
  } | null>(null);

  const scrollRoot =
    root.type === 'scroll' ? (root as unknown as ScrollRoot) : null;
  const aboveSection = scrollRoot?.sections.find(
    (s) => s.id === aboveSectionId,
  );
  const belowSection = belowSectionId
    ? scrollRoot?.sections.find((s) => s.id === belowSectionId)
    : null;

  const isDisabled = !aboveSection || aboveSection.height.type === 'auto';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();

      const el = e.currentTarget as HTMLElement;
      const aboveEl = el.previousElementSibling as HTMLElement | null;
      if (!aboveEl) return;

      // Find below section element (next wrapper div's first child)
      const wrapper = el.parentElement;
      const nextWrapper = wrapper?.nextElementSibling;
      const belowEl = nextWrapper?.firstElementChild as HTMLElement | null;

      startRef.current = {
        y: e.clientY,
        aboveHeight: aboveEl.offsetHeight,
        belowHeight: belowEl?.offsetHeight ?? 0,
      };
      el.setPointerCapture(e.pointerId);
    },
    [isDisabled],
  );

  const applyResize = useCallback(
    (dy: number, snap: boolean) => {
      if (!startRef.current) return;

      const MIN_HEIGHT = 50;
      let newAboveHeight = Math.max(
        MIN_HEIGHT,
        startRef.current.aboveHeight + dy,
      );

      if (snap && canvasHeight > 0) {
        const edges = getHorizontalGridEdges(canvasHeight, rows, rowGutter);
        newAboveHeight = snapToNearestEdge(newAboveHeight, edges);
      }

      resizeSection(aboveSectionId, {
        type: 'fixed',
        value: `${Math.round(newAboveHeight)}px`,
      });

      if (belowSectionId && belowSection) {
        let newBelowHeight = Math.max(
          MIN_HEIGHT,
          startRef.current.belowHeight - dy,
        );

        if (snap && canvasHeight > 0) {
          const edges = getHorizontalGridEdges(canvasHeight, rows, rowGutter);
          newBelowHeight = snapToNearestEdge(newBelowHeight, edges);
        }

        resizeSection(belowSectionId, {
          type: 'fixed',
          value: `${Math.round(newBelowHeight)}px`,
        });
      }
    },
    [
      aboveSectionId,
      belowSectionId,
      belowSection,
      resizeSection,
      canvasHeight,
      rows,
      rowGutter,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      applyResize(dy, false);
    },
    [applyResize],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      applyResize(dy, true);
      startRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [applyResize],
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
