# Snap-to-Grid Resize Design

## Overview

When in edit mode, splitter resize snaps panel boundaries to the nearest edge of the global 24-column grid (same grid as the GridOverlay). This works regardless of whether the grid overlay is visible. Snapping uses the global canvas coordinate system, so nested splitters align to the same grid.

## GridContext

A React context providing canvas dimensions and grid parameters to all layout components.

**Location:** `src/layout/grid/GridContext.tsx`

```ts
type GridContextValue = {
  canvasWidth: number;
  canvasHeight: number;
  columns: number; // 24
  gutter: number; // 16
};
```

**Provider:** `GridProvider` wraps the `.canvas` div in `App.tsx`. Uses a `ResizeObserver` on its root element to track `canvasWidth` and `canvasHeight`.

**Consumers:**

- `GridOverlay` — reads `canvasWidth`, `canvasHeight` instead of its own ResizeObserver
- `SplitterNodeComponent` — reads grid params for snap calculation

## snapToGrid utility

**Location:** `src/layout/grid/snapToGrid.ts`

Pure function that snaps splitter boundary positions to the nearest global grid column edge.

```ts
function snapToGrid(
  pixelSizes: number[],
  containerOffset: number,
  canvasSize: number,
  columns: number,
  gutter: number,
): number[];
```

**Algorithm:**

1. Compute global grid column edges: for each column boundary `i` (1 to N-1 panels), the snap targets are the right edge of column `k` (`k * (colWidth + gutter) - gutter`) and the left edge of column `k+1` (`k * (colWidth + gutter)`), where `colWidth = (canvasSize - (columns - 1) * gutter) / columns`.
2. Convert each panel boundary to absolute canvas position: `containerOffset + sum(pixelSizes[0..i])`.
3. For each boundary, find the nearest grid edge and snap to it.
4. Convert snapped absolute positions back to relative pixel sizes.
5. Clamp: ensure no panel is smaller than 1 column width. If clamping causes overflow, redistribute from neighbors.
6. Guarantee: `sum(output) === sum(input)` (total container size preserved).

**Parameters:**

- `pixelSizes` — raw pixel sizes from antd Splitter `onResize`
- `containerOffset` — pixel offset of this splitter container from the canvas edge (left for horizontal, top for vertical)
- `canvasSize` — total canvas width (for horizontal splitters) or height (for vertical)
- `columns` — 24
- `gutter` — 16

## SplitterNode integration

In `SplitterNodeComponent.handleResize`:

1. Read `GridContext` via `useContext`.
2. Determine `containerOffset` via `containerRef.current.getBoundingClientRect()` minus canvas rect (canvas rect obtained from a ref passed through context, or from the provider element).
3. Call `snapToGrid(pixelSizes, containerOffset, canvasSize, columns, gutter)` when `editMode === true`.
4. Convert snapped pixel sizes to percentages (existing logic).

When `editMode === false`, resize is already disabled (`resizable={false}`), so no snap logic runs.

## GridOverlay refactor

Remove the internal `ResizeObserver` and `width`/`height` state from `GridOverlay`. Instead, consume `canvasWidth` and `canvasHeight` from `GridContext`. The component becomes simpler — just renders the SVG based on context values.

The `GridOverlay` div still needs `position: absolute; inset: 0` for positioning, but no longer needs a ref or ResizeObserver.

## File structure

```
src/layout/grid/
  GridContext.tsx                    # Context + Provider with ResizeObserver
  snapToGrid.ts                     # Pure snap function
  __tests__/snapToGrid.test.ts      # Unit tests for snap logic
```

Modified files:

- `src/layout/components/GridOverlay.tsx` — consume GridContext instead of own ResizeObserver
- `src/layout/components/SplitterNode.tsx` — snap in handleResize
- `src/App.tsx` — wrap canvas in GridProvider

## Edge cases

- **Canvas too small for 24 columns:** if `canvasSize < columns * gutter`, snap is a no-op (return input unchanged).
- **Vertical splitters:** use `canvasHeight` and `top` offset instead of `canvasWidth` and `left`.
- **Single panel:** no boundaries to snap — function returns input unchanged.
