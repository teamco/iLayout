# Horizontal Grid (Plan C) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 24-row horizontal grid overlay alongside the existing 24-column vertical grid, with snap support for section height drag handles.

**Architecture:** Extend `GridOverlay` to render horizontal lines via a second SVG pattern. Add `rows` + `rowGutter` to `GridContext`. Add `getHorizontalGridEdges` + `snapToHorizontalGrid` utilities for future section height snapping.

**Tech Stack:** SVG pattern, React context, pure utility functions, Vitest.

---

### Task 1: Extend GridContext with rows

**Files:**

- Modify: `src/layout/grid/GridContext.tsx`

- [ ] **Step 1: Add rows and rowGutter to context**

Update `GridContextValue`:

```ts
export type GridContextValue = {
  canvasWidth: number;
  canvasHeight: number;
  columns: number;
  gutter: number;
  rows: number;
  rowGutter: number;
};
```

Update default context value:

```ts
const GridContext = createContext<GridContextValue>({
  canvasWidth: 0,
  canvasHeight: 0,
  columns: 24,
  gutter: 16,
  rows: 24,
  rowGutter: 16,
});
```

Update `GridProviderProps`:

```ts
type GridProviderProps = {
  columns?: number;
  gutter?: number;
  rows?: number;
  rowGutter?: number;
  children: ReactNode;
};
```

Update `GridProvider`:

```ts
export function GridProvider({ columns = 24, gutter = 16, rows = 24, rowGutter = 16, children }: GridProviderProps) {
  // ... existing code ...
  return (
    <GridContext.Provider value={{ canvasWidth, canvasHeight, columns, gutter, rows, rowGutter }}>
      {/* ... */}
    </GridContext.Provider>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/grid/GridContext.tsx
git commit -m "feat(grid): add rows and rowGutter to GridContext"
```

---

### Task 2: Add horizontal lines to GridOverlay

**Files:**

- Modify: `src/layout/components/GridOverlay.tsx`

- [ ] **Step 1: Add horizontal grid pattern**

Rewrite `src/layout/components/GridOverlay.tsx` to render both vertical columns and horizontal rows:

```tsx
import { useId } from 'react';
import { useGridContext } from '@/layout/grid/GridContext';
import styles from './GridOverlay.module.less';

const COL_FILL = 'rgba(24, 144, 255, 0.08)';
const ROW_FILL = 'rgba(24, 144, 255, 0.06)';

export function GridOverlay() {
  const colPatternId = useId();
  const rowPatternId = useId();
  const { canvasWidth, canvasHeight, columns, gutter, rows, rowGutter } =
    useGridContext();

  if (canvasWidth <= 0 || canvasHeight <= 0) return null;

  const colWidth = (canvasWidth - (columns - 1) * gutter) / columns;
  const colPatternWidth = colWidth + gutter;

  const rowHeight = (canvasHeight - (rows - 1) * rowGutter) / rows;
  const rowPatternHeight = rowHeight + rowGutter;

  return (
    <div className={styles.overlay}>
      <svg width={canvasWidth} height={canvasHeight}>
        <defs>
          {/* Vertical columns pattern */}
          <pattern
            id={colPatternId}
            x="0"
            y="0"
            width={colPatternWidth}
            height={canvasHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width={colWidth}
              height={canvasHeight}
              fill={COL_FILL}
            />
          </pattern>

          {/* Horizontal rows pattern */}
          <pattern
            id={rowPatternId}
            x="0"
            y="0"
            width={canvasWidth}
            height={rowPatternHeight}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="0"
              y="0"
              width={canvasWidth}
              height={rowHeight}
              fill={ROW_FILL}
            />
          </pattern>
        </defs>

        {/* Vertical columns */}
        <rect
          width={canvasWidth}
          height={canvasHeight}
          fill={`url(#${colPatternId})`}
        />

        {/* Horizontal rows */}
        <rect
          width={canvasWidth}
          height={canvasHeight}
          fill={`url(#${rowPatternId})`}
        />
      </svg>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Verify visually**

Run: `pnpm dev`, toggle grid (Ctrl+G) — should see both vertical columns (blue) and horizontal rows (lighter blue).

- [ ] **Step 4: Commit**

```bash
git add src/layout/components/GridOverlay.tsx
git commit -m "feat(grid): add horizontal row lines to GridOverlay"
```

---

### Task 3: Add horizontal snap utility

**Files:**

- Modify: `src/layout/grid/snapToGrid.ts`
- Modify: `src/layout/grid/__tests__/snapToGrid.test.ts`

- [ ] **Step 1: Add getHorizontalGridEdges and snapToHorizontalGrid**

Add to `src/layout/grid/snapToGrid.ts` after the existing `snapToGrid` function:

```ts
/**
 * Returns absolute pixel positions of horizontal row edges.
 * Same logic as getGridEdges but for rows.
 */
export function getHorizontalGridEdges(
  canvasHeight: number,
  rows: number,
  rowGutter: number,
): number[] {
  const rowHeight = (canvasHeight - (rows - 1) * rowGutter) / rows;
  const edges: number[] = [0];
  for (let i = 1; i < rows; i++) {
    edges.push(i * (rowHeight + rowGutter) - rowGutter);
    edges.push(i * (rowHeight + rowGutter));
  }
  edges.push(canvasHeight);
  return edges;
}

/**
 * Snaps a single pixel value to the nearest horizontal grid edge.
 * Used for section height snapping.
 */
export function snapToNearestEdge(value: number, edges: number[]): number {
  let best = edges[0];
  let bestDist = Math.abs(value - best);
  for (let i = 1; i < edges.length; i++) {
    const dist = Math.abs(value - edges[i]);
    if (dist < bestDist) {
      best = edges[i];
      bestDist = dist;
    }
  }
  return best;
}
```

- [ ] **Step 2: Add tests**

Add to `src/layout/grid/__tests__/snapToGrid.test.ts`:

```ts
import { getHorizontalGridEdges, snapToNearestEdge } from '../snapToGrid';

describe('getHorizontalGridEdges', () => {
  it('returns correct edges for a 800px canvas with 24 rows', () => {
    const edges = getHorizontalGridEdges(800, 24, 16);
    expect(edges[0]).toBeCloseTo(0);
    expect(edges[edges.length - 1]).toBeCloseTo(800);
    // 24 columns → 23 gutters → 23*2 inner edges + 0 + canvasSize = 48
    expect(edges.length).toBe(2 * (24 - 1) + 2);
  });
});

describe('snapToNearestEdge', () => {
  it('snaps to the nearest edge', () => {
    const edges = [0, 50, 100, 150, 200];
    expect(snapToNearestEdge(47, edges)).toBe(50);
    expect(snapToNearestEdge(73, edges)).toBe(50);
    expect(snapToNearestEdge(76, edges)).toBe(100);
    expect(snapToNearestEdge(0, edges)).toBe(0);
    expect(snapToNearestEdge(200, edges)).toBe(200);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `pnpm test`
Expected: ALL PASS.

- [ ] **Step 4: Commit**

```bash
git add src/layout/grid/snapToGrid.ts src/layout/grid/__tests__/snapToGrid.test.ts
git commit -m "feat(grid): add horizontal grid edges and snapToNearestEdge utility"
```
