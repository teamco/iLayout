# Snap-to-Grid Resize Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Snap splitter resize boundaries to the global 24-column grid in edit mode.

**Architecture:** A shared `GridContext` provides canvas dimensions to both `GridOverlay` and `SplitterNode`. A pure `snapToGrid` function rounds splitter boundaries to the nearest grid column edge. The context centralizes the single ResizeObserver that was previously inside GridOverlay.

**Tech Stack:** React 19 Context + ResizeObserver, pure TypeScript snap utility, Vitest for tests.

---

### Task 1: Create GridContext with ResizeObserver

**Files:**

- Create: `src/layout/grid/GridContext.tsx`

- [ ] **Step 1: Create GridContext.tsx**

Create `src/layout/grid/GridContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export type GridContextValue = {
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  gutter: number;
};

const GridContext = createContext<GridContextValue>({
  canvasWidth: 0,
  canvasHeight: 0,
  columns: 24,
  gutter: 16,
});

export function useGridContext() {
  return useContext(GridContext);
}

type GridProviderProps = {
  columns?: number;
  gutter?: number;
  children: ReactNode;
};

export function GridProvider({
  columns = 24,
  gutter = 16,
  children,
}: GridProviderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setCanvasWidth(el.clientWidth);
    setCanvasHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <GridContext.Provider
      value={{ canvasWidth, canvasHeight, columns, gutter }}
    >
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      >
        {children}
      </div>
    </GridContext.Provider>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds (component not yet mounted).

- [ ] **Step 3: Commit**

```bash
git add src/layout/grid/GridContext.tsx
git commit -m "feat(grid): create GridContext with ResizeObserver provider"
```

---

### Task 2: Create snapToGrid pure utility with tests

**Files:**

- Create: `src/layout/grid/snapToGrid.ts`
- Create: `src/layout/grid/__tests__/snapToGrid.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/layout/grid/__tests__/snapToGrid.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { snapToGrid, getGridEdges } from '../snapToGrid';

const COLUMNS = 24;
const GUTTER = 16;

describe('getGridEdges', () => {
  it('returns correct edges for a 1000px canvas', () => {
    // colWidth = (1000 - 23 * 16) / 24 = (1000 - 368) / 24 = 632 / 24 ≈ 26.333
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    // First column right edge: 26.333
    // Second column left edge: 26.333 + 16 = 42.333
    expect(edges.length).toBe(COLUMNS + 1);
    expect(edges[0]).toBeCloseTo(0);
    expect(edges[1]).toBeCloseTo(26.333 + GUTTER);
    expect(edges[COLUMNS]).toBeCloseTo(1000);
  });
});

describe('snapToGrid', () => {
  it('returns input unchanged when canvas is too small', () => {
    const sizes = [50, 50];
    const result = snapToGrid(sizes, 0, 100, COLUMNS, GUTTER);
    expect(result).toEqual(sizes);
  });

  it('returns input unchanged for a single panel', () => {
    const sizes = [500];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result).toEqual(sizes);
  });

  it('snaps two equal panels to nearest grid edge', () => {
    // Canvas 1000px, two panels of 500px each
    // Boundary at absolute 500px — snap to nearest grid edge
    const sizes = [500, 500];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result[0] + result[1]).toBeCloseTo(1000);
    // Boundary should be on a grid edge
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    const snappedBoundary = result[0];
    const isOnEdge = edges.some((e) => Math.abs(e - snappedBoundary) < 0.5);
    expect(isOnEdge).toBe(true);
  });

  it('preserves total size', () => {
    const sizes = [300, 400, 300];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    const inputSum = sizes.reduce((a, b) => a + b, 0);
    const outputSum = result.reduce((a, b) => a + b, 0);
    expect(outputSum).toBeCloseTo(inputSum);
  });

  it('handles non-zero container offset', () => {
    // Container starts at 200px into canvas, 300px wide, two panels
    const sizes = [150, 150];
    const result = snapToGrid(sizes, 200, 1000, COLUMNS, GUTTER);
    expect(result[0] + result[1]).toBeCloseTo(300);
    // Boundary at absolute 200 + 150 = 350, should snap to nearest grid edge
    const edges = getGridEdges(1000, COLUMNS, GUTTER);
    const snappedAbsBoundary = 200 + result[0];
    const isOnEdge = edges.some((e) => Math.abs(e - snappedAbsBoundary) < 0.5);
    expect(isOnEdge).toBe(true);
  });

  it('enforces minimum panel size of one column width', () => {
    // Two panels, one very small — should not go below 1 col width
    const colWidth = (1000 - 23 * GUTTER) / COLUMNS;
    const sizes = [5, 995];
    const result = snapToGrid(sizes, 0, 1000, COLUMNS, GUTTER);
    expect(result[0]).toBeGreaterThanOrEqual(colWidth - 0.5);
    expect(result[0] + result[1]).toBeCloseTo(1000);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/layout/grid/__tests__/snapToGrid.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement snapToGrid**

Create `src/layout/grid/snapToGrid.ts`:

```ts
/**
 * Returns absolute pixel positions of grid column left edges (including 0 and canvasSize).
 * For 24 columns there are 25 edges: [0, col1_start, col2_start, ..., canvasSize].
 */
export function getGridEdges(
  canvasSize: number,
  columns: number,
  gutter: number,
): number[] {
  const colWidth = (canvasSize - (columns - 1) * gutter) / columns;
  const edges: number[] = [0];
  for (let i = 1; i < columns; i++) {
    edges.push(i * (colWidth + gutter));
  }
  edges.push(canvasSize);
  return edges;
}

function findNearestEdge(pos: number, edges: number[]): number {
  let best = edges[0];
  let bestDist = Math.abs(pos - best);
  for (let i = 1; i < edges.length; i++) {
    const dist = Math.abs(pos - edges[i]);
    if (dist < bestDist) {
      best = edges[i];
      bestDist = dist;
    }
  }
  return best;
}

/**
 * Snaps splitter boundaries to the nearest global grid column edge.
 *
 * @param pixelSizes  Raw pixel sizes from antd Splitter onResize
 * @param containerOffset  Pixel offset of this splitter from canvas edge
 * @param canvasSize  Total canvas width (horizontal) or height (vertical)
 * @param columns  Number of grid columns (24)
 * @param gutter  Gutter size in px (16)
 * @returns Snapped pixel sizes with preserved total
 */
export function snapToGrid(
  pixelSizes: number[],
  containerOffset: number,
  canvasSize: number,
  columns: number,
  gutter: number,
): number[] {
  if (pixelSizes.length <= 1) return pixelSizes;

  const minColWidth = (canvasSize - (columns - 1) * gutter) / columns;
  if (minColWidth <= 0) return pixelSizes;

  const totalSize = pixelSizes.reduce((a, b) => a + b, 0);
  const edges = getGridEdges(canvasSize, columns, gutter);

  // Compute absolute boundaries and snap each to nearest grid edge
  const snappedBoundaries: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < pixelSizes.length - 1; i++) {
    cumulative += pixelSizes[i];
    const absPos = containerOffset + cumulative;
    const snapped = findNearestEdge(absPos, edges);
    snappedBoundaries.push(snapped - containerOffset);
  }

  // Convert boundaries back to sizes
  const result: number[] = [];
  let prev = 0;
  for (const boundary of snappedBoundaries) {
    result.push(boundary - prev);
    prev = boundary;
  }
  result.push(totalSize - prev);

  // Clamp: ensure no panel smaller than one column width
  for (let i = 0; i < result.length; i++) {
    if (result[i] < minColWidth) {
      const deficit = minColWidth - result[i];
      result[i] = minColWidth;
      // Take from the nearest neighbor that can afford it
      const neighbor = i > 0 ? i - 1 : i + 1;
      if (neighbor < result.length) {
        result[neighbor] -= deficit;
      }
    }
  }

  // Normalize to preserve exact total
  const currentSum = result.reduce((a, b) => a + b, 0);
  if (Math.abs(currentSum - totalSize) > 0.01) {
    const diff = totalSize - currentSum;
    result[result.length - 1] += diff;
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/layout/grid/__tests__/snapToGrid.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/grid/snapToGrid.ts src/layout/grid/__tests__/snapToGrid.test.ts
git commit -m "feat(grid): add snapToGrid pure utility with tests"
```

---

### Task 3: Refactor GridOverlay to use GridContext

**Files:**

- Modify: `src/layout/components/GridOverlay.tsx`

- [ ] **Step 1: Rewrite GridOverlay to consume GridContext**

Replace the contents of `src/layout/components/GridOverlay.tsx` with:

```tsx
import { useId } from 'react';
import { useGridContext } from '@/layout/grid/GridContext';
import styles from './GridOverlay.module.less';

const FILL = 'rgba(24, 144, 255, 0.08)';

export function GridOverlay() {
  const patternId = useId();
  const { canvasWidth, canvasHeight, columns, gutter } = useGridContext();

  if (canvasWidth <= 0) return null;

  const colWidth = (canvasWidth - (columns - 1) * gutter) / columns;
  const patternWidth = colWidth + gutter;

  return (
    <div className={styles.overlay}>
      <svg width={canvasWidth} height={canvasHeight}>
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={patternWidth}
            height={canvasHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width={colWidth}
              height={canvasHeight}
              fill={FILL}
            />
          </pattern>
        </defs>
        <rect
          width={canvasWidth}
          height={canvasHeight}
          fill={`url(#${patternId})`}
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. (GridOverlay now depends on GridContext which is not yet provided in App — this is OK because GridOverlay is conditionally rendered and we'll wire GridProvider in Task 5.)

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/GridOverlay.tsx
git commit -m "refactor(grid): simplify GridOverlay to consume GridContext"
```

---

### Task 4: Add snap logic to SplitterNode

**Files:**

- Modify: `src/layout/components/SplitterNode.tsx`

- [ ] **Step 1: Add snap to handleResize**

Replace the contents of `src/layout/components/SplitterNode.tsx` with:

```tsx
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
  const resize = useLayoutStore((s) => s.resize);
  const editMode = useLayoutStore((s) => s.editMode);
  const activeWidgetEditId = useLayoutStore((s) => s.activeWidgetEditId);
  const { canvasWidth, canvasHeight, columns, gutter } = useGridContext();

  const resizingDisabled = !editMode || activeWidgetEditId !== null;

  function handleResize(pixelSizes: number[]) {
    const container = containerRef.current;
    if (!container) return;
    const total =
      node.direction === 'horizontal'
        ? container.offsetWidth
        : container.offsetHeight;
    if (total === 0) return;

    let sizes = pixelSizes;
    if (editMode) {
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
      sizes = snapToGrid(
        pixelSizes,
        containerOffset,
        canvasSize,
        columns,
        gutter,
      );
    }

    const percentages = sizes.map((px) => (px / total) * 100);
    const sum = percentages.reduce((a, b) => a + b, 0);
    const normalized = percentages.map((p) => (p / sum) * 100);
    resize(node.id, normalized);
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <Splitter
        orientation={
          node.direction === 'horizontal' ? 'horizontal' : 'vertical'
        }
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
```

Note: The `data-grid-canvas` attribute is used to find the canvas element via `closest()`. This attribute will be added to the GridProvider wrapper div in Task 5.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/SplitterNode.tsx
git commit -m "feat(grid): add snap-to-grid in SplitterNode handleResize"
```

---

### Task 5: Wire GridProvider into App.tsx

**Files:**

- Modify: `src/App.tsx`
- Modify: `src/layout/grid/GridContext.tsx` (add `data-grid-canvas` attribute)

- [ ] **Step 1: Add data-grid-canvas to GridProvider wrapper div**

In `src/layout/grid/GridContext.tsx`, update the wrapper div in the `GridProvider` return:

```tsx
<GridContext.Provider value={{ canvasWidth, canvasHeight, columns, gutter }}>
  <div
    ref={containerRef}
    data-grid-canvas
    style={{ width: '100%', height: '100%', position: 'relative' }}
  >
    {children}
  </div>
</GridContext.Provider>
```

- [ ] **Step 2: Wrap canvas contents with GridProvider in App.tsx**

In `src/App.tsx`, add the import:

```tsx
import { GridProvider } from '@/layout/grid/GridContext';
```

Replace the canvas div contents:

```tsx
<div className={styles.canvas}>
  <GridProvider>
    <LayoutRenderer />
    {showGrid && <GridOverlay />}
  </GridProvider>
</div>
```

- [ ] **Step 3: Verify build and tests**

Run: `pnpm build && pnpm test`
Expected: Both pass.

- [ ] **Step 4: Verify manually**

Run: `pnpm dev`

- Enable Edit Mode, toggle grid (Ctrl+G) — grid overlay still works
- Add panels, resize splitters — boundaries snap to grid column edges
- Nested splitters snap to the same global grid
- Disable Edit Mode — resize is free (already disabled, but verify no errors)

- [ ] **Step 5: Commit**

```bash
git add src/layout/grid/GridContext.tsx src/App.tsx
git commit -m "feat(grid): wire GridProvider into App, enable snap-to-grid resize"
```
