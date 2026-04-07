# Grid Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 24-column SVG grid overlay with 16px gutters, visible during edit mode, toggled via toolbar button and Ctrl+G.

**Architecture:** A `GridOverlay` component renders an absolutely positioned SVG with a `<pattern>` element that tiles 24 semi-transparent columns. A `ResizeObserver` recalculates column widths on container resize. State lives in `layoutStore` (`showGrid` + `toggleGrid`).

**Tech Stack:** React 19, SVG `<pattern>`, ResizeObserver, Zustand/Immer, Ant Design Button + Icons, Less modules.

---

### Task 1: Add `showGrid` state to layout store

**Files:**
- Modify: `src/layout/store/layoutStore.ts`
- Test: `src/layout/store/__tests__/layoutStore.test.ts`

- [ ] **Step 1: Write failing tests for showGrid and toggleGrid**

Add to `src/layout/store/__tests__/layoutStore.test.ts`:

```ts
it('toggles showGrid', () => {
  const store = createLayoutStore();
  expect(store.getState().showGrid).toBe(false);
  act(() => store.getState().toggleGrid());
  expect(store.getState().showGrid).toBe(true);
  act(() => store.getState().toggleGrid());
  expect(store.getState().showGrid).toBe(false);
});

it('resets showGrid when editMode is turned off', () => {
  const store = createLayoutStore();
  act(() => store.getState().setEditMode(true));
  act(() => store.getState().toggleGrid());
  expect(store.getState().showGrid).toBe(true);
  act(() => store.getState().setEditMode(false));
  expect(store.getState().showGrid).toBe(false);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/layout/store/__tests__/layoutStore.test.ts`
Expected: FAIL — `showGrid` and `toggleGrid` don't exist yet.

- [ ] **Step 3: Implement showGrid state and toggleGrid action**

In `src/layout/store/layoutStore.ts`:

Add to `LayoutState`:
```ts
showGrid: boolean;
```

Add to `LayoutActions`:
```ts
toggleGrid: () => void;
```

Add to `makeActions`:
```ts
toggleGrid() {
  set(state => { state.showGrid = !state.showGrid; });
},
```

Modify `setEditMode` in `makeActions`:
```ts
setEditMode(on) {
  set(state => {
    state.editMode = on;
    if (!on) state.showGrid = false;
  });
},
```

Add `showGrid: false` to initial state in both `createLayoutStore` and `useLayoutStore`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/layout/store/__tests__/layoutStore.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/layout/store/layoutStore.ts src/layout/store/__tests__/layoutStore.test.ts
git commit -m "feat(grid): add showGrid state and toggleGrid action to layout store"
```

---

### Task 2: Add `@z-grid` token to theme mixins

**Files:**
- Modify: `src/themes/mixin.module.less`

- [ ] **Step 1: Add z-grid token**

In `src/themes/mixin.module.less`, add after `@z-overlay: 10;`:

```less
@z-grid:          12;
```

(Between `@z-overlay: 10` and `@z-toolbar: 20`, so the grid sits above leaf overlays but below everything interactive.)

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/themes/mixin.module.less
git commit -m "feat(grid): add @z-grid z-index token"
```

---

### Task 3: Create `GridOverlay` component

**Files:**
- Create: `src/layout/components/GridOverlay.tsx`
- Create: `src/layout/components/GridOverlay.module.less`

- [ ] **Step 1: Create GridOverlay.module.less**

Create `src/layout/components/GridOverlay.module.less`:

```less
@import '@/themes/mixin.module.less';

.overlay {
  .absolute-fill();
  z-index: @z-grid;
  pointer-events: none;
}
```

- [ ] **Step 2: Create GridOverlay component**

Create `src/layout/components/GridOverlay.tsx`:

```tsx
import { useRef, useState, useEffect, useCallback } from 'react';
import styles from './GridOverlay.module.less';

const COLUMNS = 24;
const GUTTER = 16;
const FILL = 'rgba(24, 144, 255, 0.08)';

export function GridOverlay() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setWidth(el.clientWidth);
    setHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const colWidth = width > 0 ? (width - (COLUMNS - 1) * GUTTER) / COLUMNS : 0;
  const patternWidth = colWidth + GUTTER;

  return (
    <div ref={containerRef} className={styles.overlay}>
      {width > 0 && (
        <svg width={width} height={height}>
          <defs>
            <pattern
              id="grid-col"
              x="0"
              y="0"
              width={patternWidth}
              height={height}
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width={colWidth} height={height} fill={FILL} />
            </pattern>
          </defs>
          <rect width={width} height={height} fill="url(#grid-col)" />
        </svg>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds (component is not yet mounted).

- [ ] **Step 4: Commit**

```bash
git add src/layout/components/GridOverlay.tsx src/layout/components/GridOverlay.module.less
git commit -m "feat(grid): create GridOverlay SVG component"
```

---

### Task 4: Wire GridOverlay into App + add toolbar button and keyboard shortcut

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/App.module.less`

- [ ] **Step 1: Add grid toggle button and GridOverlay to App.tsx**

In `src/App.tsx`, add imports:

```tsx
import { AppstoreOutlined } from '@ant-design/icons';
import { GridOverlay } from '@/layout/components/GridOverlay';
```

Add store selectors alongside existing ones:

```tsx
const showGrid = useLayoutStore(s => s.showGrid);
const toggleGrid = useLayoutStore(s => s.toggleGrid);
```

Add keyboard shortcut effect after the existing `useEffect`:

```tsx
useEffect(() => {
  if (!editMode) return;
  const handler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
      e.preventDefault();
      toggleGrid();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [editMode, toggleGrid]);
```

Add grid toggle button in the toolbar, after the Edit Mode button:

```tsx
{editMode && (
  <Button
    type={showGrid ? 'primary' : 'default'}
    size="small"
    icon={<AppstoreOutlined />}
    onClick={toggleGrid}
  />
)}
```

Wrap `.canvas` contents in `position: relative` and add GridOverlay:

```tsx
<div className={styles.canvas}>
  <LayoutRenderer />
  {showGrid && <GridOverlay />}
</div>
```

- [ ] **Step 2: Add position relative to canvas**

In `src/App.module.less`, update `.canvas`:

```less
.canvas {
  flex: 1;
  overflow: hidden;
  position: relative;
}
```

- [ ] **Step 3: Verify the feature manually**

Run: `pnpm dev`
Open browser, enable Edit Mode, click the grid button or press Ctrl+G. Verify:
- 24 semi-transparent blue columns appear over the canvas
- Columns have 16px gutters between them
- Grid disappears when Edit Mode is turned off
- Grid toggle button highlights when grid is active
- Ctrl+G / Cmd+G toggles the grid
- Grid resizes correctly when the window is resized
- Content beneath the grid remains interactive (pointer-events: none)

- [ ] **Step 4: Verify build and lint**

Run: `pnpm build && pnpm lint`
Expected: Both pass.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/App.module.less
git commit -m "feat(grid): wire GridOverlay with toolbar button and Ctrl+G shortcut"
```
