# Global Panels — CSS Grid Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace SplitterNode-based global panels with CSS Grid layout (`GridRoot`) so sidebars stretch to full content height and body scrolls with a single scrollbar.

**Architecture:** New `GridRoot` node type renders as CSS Grid. Columns hold `LayoutNode` children (leaf, splitter, scroll). ScrollLayout inside a grid column expands naturally (no inner scroll). Store actions wrap/extend GridRoot when user adds global panels via toolbar "+".

**Tech Stack:** React 19, Zustand + Immer, CSS Grid, existing snap-to-grid utilities

**Spec:** `docs/superpowers/specs/2026-04-10-global-panels-grid-design.md`

---

### Task 1: Add GridRoot Types

**Files:**
- Modify: `src/layout/types.ts`

- [ ] **Step 1: Add GridColumn and GridRoot types**

Add after `ScrollRoot` type and before the `LayoutNode` union:

```ts
export type GridColumn = {
  id: string;
  size: string;
  child: LayoutNode;
};

export type GridRoot = {
  id: string;
  type: 'grid';
  columns: GridColumn[];
};
```

- [ ] **Step 2: Update LayoutNode union**

Change:
```ts
export type LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot;
```
To:
```ts
export type LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot | GridRoot;
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm -w run lint`
Expected: 0 errors (warnings ok)

- [ ] **Step 4: Commit**

```bash
git add src/layout/types.ts
git commit -m "feat(grid): add GridRoot and GridColumn types"
```

---

### Task 2: Update Tree Utilities for GridRoot

**Files:**
- Modify: `src/layout/utils/treeUtils.ts`
- Test: `src/layout/utils/__tests__/treeUtils.test.ts`

- [ ] **Step 1: Write tests for grid traversal**

Add to `src/layout/utils/__tests__/treeUtils.test.ts`:

```ts
import type { GridRoot, GridColumn } from '../../types';

const gridLeafA: LeafNode = { id: 'grid-leaf-a', type: 'leaf' };
const gridLeafB: LeafNode = { id: 'grid-leaf-b', type: 'leaf' };
const gridRoot: GridRoot = {
  id: 'grid-root',
  type: 'grid',
  columns: [
    { id: 'col-1', size: '200px', child: gridLeafA },
    { id: 'col-2', size: '1fr', child: gridLeafB },
  ],
};

describe('grid support', () => {
  it('findNode finds nodes inside grid columns', () => {
    const result = findNode(gridRoot as unknown as LayoutNode, 'grid-leaf-a');
    expect(result).not.toBeNull();
    expect(result!.node.id).toBe('grid-leaf-a');
  });

  it('getDepth works for nodes in grid columns', () => {
    const depth = getDepth(gridLeafA, gridRoot as unknown as LayoutNode);
    expect(depth).toBe(0);
  });

  it('updateNode updates nodes inside grid columns', () => {
    const updated = updateNode(
      gridRoot as unknown as LayoutNode,
      'grid-leaf-a',
      (n) => ({ ...n, widget: { widgetId: 'w1', resource: 'empty', content: { value: '' }, config: {} } }),
    );
    expect((updated as any).columns[0].child.widget).toBeDefined();
  });

  it('removeNode works inside grid columns', () => {
    const splitterInGrid: GridRoot = {
      id: 'g1',
      type: 'grid',
      columns: [
        {
          id: 'c1',
          size: '1fr',
          child: {
            id: 's1',
            type: 'splitter',
            direction: 'horizontal',
            sizes: [50, 50],
            children: [
              { id: 'la', type: 'leaf' },
              { id: 'lb', type: 'leaf' },
            ],
          },
        },
      ],
    };
    const result = removeNode(splitterInGrid as unknown as LayoutNode, 'la');
    expect((result as any).columns[0].child.id).toBe('lb');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/layout/utils/__tests__/treeUtils.test.ts`
Expected: FAIL — grid type not handled

- [ ] **Step 3: Add grid support to findNode**

In `findNode`, add before the final `return null`:

```ts
if (root.type === 'grid') {
  const grid = root as unknown as GridRoot;
  for (const col of grid.columns) {
    const found = findNode(col.child, id);
    if (found) return found;
  }
}
```

Add import `GridRoot` at the top.

- [ ] **Step 4: Add grid support to getDepth**

In `getDepth`'s inner `walk` function, add before the final `return null`:

```ts
if (node.type === 'grid') {
  const grid = node as unknown as GridRoot;
  for (const col of grid.columns) {
    const d = walk(col.child, depth);
    if (d !== null) return d;
  }
}
```

- [ ] **Step 5: Add grid support to updateNode**

In `updateNode`, add before the final `return root`:

```ts
if (root.type === 'grid') {
  const grid = root as unknown as GridRoot;
  return {
    ...grid,
    columns: grid.columns.map((col) => ({
      ...col,
      child: updateNode(col.child, id, fn),
    })),
  } as unknown as LayoutNode;
}
```

- [ ] **Step 6: Add grid support to removeNode**

In `removeNode`, add before the final `return root`:

```ts
if (root.type === 'grid') {
  const grid = root as unknown as GridRoot;
  return {
    ...grid,
    columns: grid.columns.map((col) => ({
      ...col,
      child: removeNode(col.child, id),
    })),
  } as unknown as LayoutNode;
}
```

- [ ] **Step 7: Run tests — all should pass**

Run: `pnpm test -- src/layout/utils/__tests__/treeUtils.test.ts`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/layout/utils/treeUtils.ts src/layout/utils/__tests__/treeUtils.test.ts
git commit -m "feat(grid): add grid support to tree utilities"
```

---

### Task 3: Store Actions — addGridColumn, removeGridColumn, resizeGridColumn

**Files:**
- Modify: `src/layout/store/layoutStore.ts`
- Test: `src/layout/store/__tests__/layoutStore.test.ts`

- [ ] **Step 1: Write tests**

Add to `src/layout/store/__tests__/layoutStore.test.ts`:

```ts
import type { ScrollRoot, GridRoot } from '../../types';

describe('grid column actions', () => {
  it('addGridColumn wraps scroll root in grid with left column', () => {
    const scrollRoot: ScrollRoot = {
      id: 'sr1',
      type: 'scroll',
      sections: [{ id: 'sec1', type: 'section', height: { type: 'fixed', value: '100vh' }, child: { id: 'l1', type: 'leaf' } }],
    };
    const store = createLayoutStore(scrollRoot as unknown as LayoutNode);
    store.getState().addGridColumn('left');
    const root = store.getState().root as unknown as GridRoot;
    expect(root.type).toBe('grid');
    expect(root.columns).toHaveLength(2);
    expect(root.columns[0].child.type).toBe('leaf');
    expect(root.columns[1].child.type).toBe('scroll');
  });

  it('addGridColumn adds right column to existing grid', () => {
    const gridRoot: GridRoot = {
      id: 'g1',
      type: 'grid',
      columns: [
        { id: 'c1', size: '1fr', child: { id: 'sr1', type: 'scroll', sections: [] } as unknown as LayoutNode },
      ],
    };
    const store = createLayoutStore(gridRoot as unknown as LayoutNode);
    store.getState().addGridColumn('right');
    const root = store.getState().root as unknown as GridRoot;
    expect(root.columns).toHaveLength(2);
    expect(root.columns[1].child.type).toBe('leaf');
  });

  it('removeGridColumn unwraps grid when one column left', () => {
    const scrollChild = { id: 'sr1', type: 'scroll', sections: [] } as unknown as LayoutNode;
    const gridRoot: GridRoot = {
      id: 'g1',
      type: 'grid',
      columns: [
        { id: 'c1', size: '200px', child: { id: 'l1', type: 'leaf' } },
        { id: 'c2', size: '1fr', child: scrollChild },
      ],
    };
    const store = createLayoutStore(gridRoot as unknown as LayoutNode);
    store.getState().removeGridColumn('c1');
    expect(store.getState().root.type).toBe('scroll');
  });

  it('resizeGridColumn updates column size', () => {
    const gridRoot: GridRoot = {
      id: 'g1',
      type: 'grid',
      columns: [
        { id: 'c1', size: '200px', child: { id: 'l1', type: 'leaf' } },
        { id: 'c2', size: '1fr', child: { id: 'l2', type: 'leaf' } },
      ],
    };
    const store = createLayoutStore(gridRoot as unknown as LayoutNode);
    store.getState().resizeGridColumn('c1', '300px');
    const root = store.getState().root as unknown as GridRoot;
    expect(root.columns[0].size).toBe('300px');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `pnpm test -- src/layout/store/__tests__/layoutStore.test.ts`
Expected: FAIL — actions don't exist

- [ ] **Step 3: Add types to LayoutActions**

In `LayoutActions` type, add:

```ts
addGridColumn: (position: 'left' | 'right', size?: string) => void;
removeGridColumn: (columnId: string) => void;
resizeGridColumn: (columnId: string, size: string) => void;
```

- [ ] **Step 4: Implement addGridColumn**

In `makeActions`, add:

```ts
addGridColumn(position, size = '200px') {
  set((state) => {
    const { nanoid } = require('nanoid');
    const newLeaf: LayoutNode = { id: nanoid(), type: 'leaf' };
    const newColumn: GridColumn = { id: nanoid(), size, child: newLeaf };

    if (state.root.type === 'grid') {
      const grid = state.root as unknown as GridRoot;
      if (position === 'left') {
        grid.columns.unshift(newColumn);
      } else {
        grid.columns.push(newColumn);
      }
    } else {
      // Wrap current root in grid
      const existingColumn: GridColumn = {
        id: nanoid(),
        size: '1fr',
        child: state.root,
      };
      const columns = position === 'left'
        ? [newColumn, existingColumn]
        : [existingColumn, newColumn];
      state.root = {
        id: nanoid(),
        type: 'grid',
        columns,
      } as unknown as LayoutNode;
    }
  });
},
```

Add imports at the top of the file: `import type { GridRoot, GridColumn } from '../types';`

Note: use `nanoid` via dynamic require inside immer, or import it at the top (it's already imported at the top of layoutStore.ts).

- [ ] **Step 5: Implement removeGridColumn**

```ts
removeGridColumn(columnId) {
  set((state) => {
    if (state.root.type !== 'grid') return;
    const grid = state.root as unknown as GridRoot;
    grid.columns = grid.columns.filter((c) => c.id !== columnId);
    if (grid.columns.length === 1) {
      state.root = grid.columns[0].child;
    }
  });
},
```

- [ ] **Step 6: Implement resizeGridColumn**

```ts
resizeGridColumn(columnId, size) {
  set((state) => {
    if (state.root.type !== 'grid') return;
    const grid = state.root as unknown as GridRoot;
    const col = grid.columns.find((c) => c.id === columnId);
    if (col) col.size = size;
  });
},
```

- [ ] **Step 7: Run tests — all should pass**

Run: `pnpm test -- src/layout/store/__tests__/layoutStore.test.ts`
Expected: All PASS

- [ ] **Step 8: Commit**

```bash
git add src/layout/store/layoutStore.ts src/layout/store/__tests__/layoutStore.test.ts
git commit -m "feat(grid): add grid column store actions"
```

---

### Task 4: GridLayout Component + GridColumnHandle

**Files:**
- Create: `src/layout/components/GridLayout.tsx`
- Create: `src/layout/components/GridLayout.module.less`
- Create: `src/layout/components/GridColumnHandle.tsx`

- [ ] **Step 1: Create GridLayout.module.less**

```less
@import '@/themes/mixin.module.less';

.grid {
  display: grid;
  min-height: 100vh;
  width: 100%;
}

.column {
  position: relative;
  overflow: hidden;
}
```

- [ ] **Step 2: Create GridLayout component**

```tsx
// src/layout/components/GridLayout.tsx
import { useState } from 'react';
import type { GridRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { renderNode } from './LayoutRenderer';
import { GridColumnHandle } from './GridColumnHandle';
import styles from './GridLayout.module.less';

type Props = { root: GridRoot };

export function GridLayout({ root }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);

  const templateColumns = root.columns.map((col) => col.size).join(' ');

  return (
    <div className={styles.grid} style={{ gridTemplateColumns: templateColumns }}>
      {root.columns.map((col, i) => (
        <div key={col.id} className={styles.column}>
          {renderNode(col.child)}
          {editMode && i < root.columns.length - 1 && (
            <GridColumnHandle
              leftColumnId={col.id}
              rightColumnId={root.columns[i + 1].id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create GridColumnHandle**

```tsx
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

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
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
    },
    [],
  );

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

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      startRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    [],
  );

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
```

- [ ] **Step 4: Verify types compile**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/layout/components/GridLayout.tsx src/layout/components/GridLayout.module.less src/layout/components/GridColumnHandle.tsx
git commit -m "feat(grid): add GridLayout component with column resize handle"
```

---

### Task 5: Wire GridLayout into LayoutRenderer

**Files:**
- Modify: `src/layout/components/LayoutRenderer.tsx`

- [ ] **Step 1: Add grid rendering to renderNode**

Add import:
```ts
import type { GridRoot } from '@/layout/types';
import { GridLayout } from './GridLayout';
```

In `renderNode`, add before the `scroll` case:
```ts
if (node.type === 'grid')
  return <GridLayout key={node.id} root={node as unknown as GridRoot} />;
```

- [ ] **Step 2: Add grid root handling in LayoutRenderer**

Update the render logic:
```tsx
export function LayoutRenderer() {
  const root = useLayoutStore((s) => s.root);
  const layoutMode = useLayoutStore((s) => s.layoutMode);

  return (
    <LayoutDndContext>
      <div className={styles.root}>
        {layoutMode === 'scroll' && root.type === 'scroll' ? (
          <ScrollLayout root={root as unknown as ScrollRoot} />
        ) : layoutMode === 'scroll' && root.type === 'grid' ? (
          <GridLayout root={root as unknown as GridRoot} />
        ) : (
          renderNode(root)
        )}
      </div>
    </LayoutDndContext>
  );
}
```

- [ ] **Step 3: ScrollLayout inside grid column — no nested flag**

In `renderNode`, the `scroll` case currently passes `nested`:
```ts
if (node.type === 'scroll')
  return <ScrollLayout key={node.id} root={node} nested />;
```

This stays as-is for scroll-inside-splitter. When scroll is inside a GridColumn, `renderNode` is called from `GridLayout` — the `nested` flag is passed, which is correct for splitter-based nesting. But for grid columns, we want NO inner scroll.

Update `renderNode` to NOT pass `nested` — grid columns expand naturally:

Actually, we need context to know if we're inside a grid. Simpler approach: `GridLayout` renders scroll children directly without `nested`:

Update `GridLayout.tsx` — replace `renderNode(col.child)` with:

```tsx
import { ScrollLayout } from './ScrollLayout';
import type { ScrollRoot } from '@/layout/types';

// In the render:
{col.child.type === 'scroll' ? (
  <ScrollLayout root={col.child as unknown as ScrollRoot} />
) : (
  renderNode(col.child)
)}
```

This ensures scroll inside grid = no inner overflow (body scrolls). Scroll inside splitter = nested (inner overflow).

- [ ] **Step 4: Verify lint passes**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
git add src/layout/components/LayoutRenderer.tsx src/layout/components/GridLayout.tsx
git commit -m "feat(grid): wire GridLayout into LayoutRenderer"
```

---

### Task 6: Toolbar "+" — Use addGridColumn Instead of Splitter

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace splitter wrapping with addGridColumn**

In `src/App.tsx`, find the `AddPanelModal` `onSelect` handler (the `if (dir === 'left' || dir === 'right')` block). Replace:

```tsx
if (dir === 'left' || dir === 'right') {
  // Horizontal: wrap entire root in horizontal splitter
  const { nanoid } = await import('nanoid');
  const currentRoot = useLayoutStore.getState().root;
  const newLeaf = { id: nanoid(), type: 'leaf' as const };
  const after = dir === 'right';
  useLayoutStore.setState({
    root: {
      id: nanoid(),
      type: 'splitter' as const,
      direction: 'horizontal' as const,
      sizes: after ? [80, 20] : [20, 80],
      children: after
        ? [currentRoot, newLeaf]
        : [newLeaf, currentRoot],
    },
  });
}
```

With:

```tsx
if (dir === 'left' || dir === 'right') {
  useLayoutStore.getState().addGridColumn(dir === 'left' ? 'left' : 'right');
}
```

- [ ] **Step 2: Show "+" button for grid root too**

The "+" button currently shows when `editMode && layoutMode === 'scroll'`. The root might now be `grid` type. The condition is fine — `layoutMode === 'scroll'` is the mode flag, not the root type.

No change needed.

- [ ] **Step 3: Verify lint passes**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(grid): toolbar + uses addGridColumn for global panels"
```

---

### Task 7: Update LeafOverlay for Grid Context

**Files:**
- Modify: `src/layout/components/LeafOverlay.tsx`

- [ ] **Step 1: Update findSectionForNode to handle grid**

The `findSectionForNode` function only checks `root.type === 'scroll'`. When root is `grid`, sections are inside grid columns. Update:

```ts
import type { GridRoot } from '@/layout/types';

function findSectionForNode(root: LayoutNode, nodeId: string): string | null {
  if (root.type === 'scroll') {
    const scrollRoot = root as unknown as ScrollRoot;
    for (const section of scrollRoot.sections) {
      if (containsNode(section.child, nodeId)) return section.id;
    }
  }
  if (root.type === 'grid') {
    const grid = root as unknown as GridRoot;
    for (const col of grid.columns) {
      const result = findSectionForNode(col.child, nodeId);
      if (result) return result;
    }
  }
  return null;
}
```

- [ ] **Step 2: Update containsNode for grid**

```ts
function containsNode(node: LayoutNode, targetId: string): boolean {
  if (node.id === targetId) return true;
  if (node.type === 'splitter')
    return node.children.some((c) => containsNode(c, targetId));
  if (node.type === 'section') return containsNode(node.child, targetId);
  if (node.type === 'scroll') {
    const scroll = node as unknown as ScrollRoot;
    return scroll.sections.some((s) => containsNode(s, targetId));
  }
  if (node.type === 'grid') {
    const grid = node as unknown as GridRoot;
    return grid.columns.some((c) => containsNode(c.child, targetId));
  }
  return false;
}
```

- [ ] **Step 3: Verify lint passes**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/layout/components/LeafOverlay.tsx
git commit -m "feat(grid): update LeafOverlay to traverse grid nodes"
```

---

### Task 8: Update setLayoutMode for Grid Conversion

**Files:**
- Modify: `src/layout/store/layoutStore.ts`

- [ ] **Step 1: Handle viewport↔scroll conversion with grid**

In `setLayoutMode`, the current code converts splitter↔scroll. Add grid handling:

When converting scroll→viewport and root is `grid`: unwrap grid, take the scroll column, unwrap scroll, return first section's child.

When converting viewport→scroll and root has a grid: this shouldn't happen (grid is only in scroll mode).

Update `setLayoutMode`:

```ts
setLayoutMode(mode) {
  set((state) => {
    if (mode === 'scroll' && state.root.type !== 'scroll' && state.root.type !== 'grid') {
      const section: SectionNode = {
        id: nanoid(),
        type: 'section',
        height: { type: 'fixed', value: '100vh' },
        child: state.root,
      };
      state.root = {
        id: nanoid(),
        type: 'scroll',
        sections: [section],
      } as unknown as LayoutNode;
    } else if (mode === 'viewport') {
      if (state.root.type === 'grid') {
        const grid = state.root as unknown as GridRoot;
        const scrollCol = grid.columns.find((c) => c.child.type === 'scroll');
        const scrollRoot = scrollCol?.child as unknown as ScrollRoot | undefined;
        state.root = scrollRoot?.sections[0]?.child ?? { id: nanoid(), type: 'leaf' };
      } else if (state.root.type === 'scroll') {
        const scrollRoot = state.root as unknown as ScrollRoot;
        state.root = scrollRoot.sections[0]?.child ?? { id: nanoid(), type: 'leaf' };
      }
    }
    state.layoutMode = mode;
  });
},
```

- [ ] **Step 2: Verify lint passes**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 3: Commit**

```bash
git add src/layout/store/layoutStore.ts
git commit -m "feat(grid): handle grid in setLayoutMode conversion"
```

---

### Task 9: Update addSection for Grid Root

**Files:**
- Modify: `src/layout/store/layoutStore.ts`

- [ ] **Step 1: Update addSection to find scroll inside grid**

Currently `addSection` checks `state.root.type !== 'scroll'`. When root is `grid`, the scroll is inside a column. Update:

```ts
addSection(position, targetSectionId) {
  set((state) => {
    let scrollRoot: ScrollRoot | null = null;

    if (state.root.type === 'scroll') {
      scrollRoot = state.root as unknown as ScrollRoot;
    } else if (state.root.type === 'grid') {
      const grid = state.root as unknown as GridRoot;
      for (const col of grid.columns) {
        if (col.child.type === 'scroll') {
          scrollRoot = col.child as unknown as ScrollRoot;
          break;
        }
      }
    }

    if (!scrollRoot) return;
    const idx = scrollRoot.sections.findIndex((s) => s.id === targetSectionId);
    if (idx === -1) return;
    const newSection: SectionNode = {
      id: nanoid(),
      type: 'section',
      height: { type: 'min', value: '200px' },
      child: { id: nanoid(), type: 'leaf' },
    };
    const insertAt = position === 'before' ? idx : idx + 1;
    scrollRoot.sections.splice(insertAt, 0, newSection);
  });
},
```

- [ ] **Step 2: Do the same for removeSection, resizeSection, updateSectionConfig, reorderSections**

Each of these starts with `if (state.root.type !== 'scroll') return;`. Add a helper function to find the scroll root:

```ts
function getScrollRoot(state: LayoutStore): ScrollRoot | null {
  if (state.root.type === 'scroll') return state.root as unknown as ScrollRoot;
  if (state.root.type === 'grid') {
    const grid = state.root as unknown as GridRoot;
    for (const col of grid.columns) {
      if (col.child.type === 'scroll') return col.child as unknown as ScrollRoot;
    }
  }
  return null;
}
```

Define this helper inside `makeActions` (before the return), then replace `if (state.root.type !== 'scroll') return; const scrollRoot = state.root as unknown as ScrollRoot;` with `const scrollRoot = getScrollRoot(state); if (!scrollRoot) return;` in all five section actions.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add src/layout/store/layoutStore.ts
git commit -m "feat(grid): section actions work with grid root"
```

---

### Task 10: Final Verification

- [ ] **Step 1: Run all tests**

Run: `pnpm test`
Expected: All pass

- [ ] **Step 2: Run lint**

Run: `pnpm -w run lint`
Expected: 0 errors

- [ ] **Step 3: Run prettier**

Run: `pnpm format`

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 5: Commit any formatting fixes**

```bash
git add -A
git commit -m "style: apply prettier formatting"
```
