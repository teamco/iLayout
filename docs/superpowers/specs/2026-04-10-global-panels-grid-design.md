# Global Panels — CSS Grid Layout

**Status:** Approved
**Date:** 2026-04-10

## Overview

Replace SplitterNode-based global vertical panels with a CSS Grid layout (`GridRoot`). This solves: double scrollbar, sidebar not stretching to content height, and body scroll not working when scroll layout is nested in a splitter.

## Problem

When a user adds a global vertical panel (sidebar) via the "+" toolbar button in scroll mode, it wraps the scroll layout in a `SplitterNode`. Splitters are viewport-height containers:

- Sidebar is fixed at viewport height, doesn't stretch to full content
- Nested ScrollLayout needs its own `overflow-y: auto`, creating a double scrollbar
- Body scroll doesn't work — content is trapped inside the splitter panel

## Solution

New node type `GridRoot` using CSS Grid. The grid defines columns where:

- Sidebar columns stretch to the tallest column's height (grid behavior)
- The scroll column (center) defines the page height via its sections
- One scrollbar (body)
- Splitters inside sidebar columns work because grid provides height context

## 1. Types

```ts
type GridColumn = {
  id: string;
  size: string; // CSS grid value: '200px', '1fr', '20%', 'minmax(100px, 300px)'
  child: LayoutNode; // leaf, splitter, or scroll
};

type GridRoot = {
  id: string;
  type: 'grid';
  columns: GridColumn[];
};
```

`LayoutNode` union updated: `LeafNode | SplitterNode | SectionNode | ScrollRoot | GridRoot`

## 2. Rendering

### GridLayout component

```tsx
<div
  class="al-grid"
  style="grid-template-columns: ${columns.map(c => c.size).join(' ')}"
>
  {columns.map((col, i) => (
    <>
      <div class="al-grid-column" key={col.id}>
        {renderNode(col.child)}
      </div>
      {editMode && i < columns.length - 1 && (
        <GridColumnHandle
          leftColumnId={col.id}
          rightColumnId={columns[i + 1].id}
        />
      )}
    </>
  ))}
</div>
```

### CSS

```css
.al-grid {
  display: grid;
  min-height: 100vh;
  width: 100%;
}

.al-grid-column {
  position: relative;
  overflow: hidden;
}
```

`grid-template-columns` set via inline style from `columns[].size`.

### GridColumnHandle

Horizontal drag handle between columns. On drag:

- Left column size changes by +dx
- Right column size changes by -dx
- Both converted to pixel values on drag, snapped to grid on release

Similar pattern to `SectionHandle` but horizontal.

## 3. Store Actions

### addGridColumn

```ts
addGridColumn(position: 'left' | 'right', size?: string): void
```

- If root is `ScrollRoot`: wrap in `GridRoot` with two columns — new leaf column + existing scroll
- If root is `GridRoot`: add column at position
- Default size: `'200px'`

### removeGridColumn

```ts
removeGridColumn(columnId: string): void
```

- Remove column from `GridRoot.columns`
- If only one column remains: unwrap — replace `GridRoot` with that column's child

### resizeGridColumn

```ts
resizeGridColumn(columnId: string, size: string): void
```

- Update `columns[].size` for the specified column

## 4. Toolbar "+" Integration

In scroll mode, the toolbar "+" button:

- "Add panel left" → `addGridColumn('left')`
- "Add panel right" → `addGridColumn('right')`
- "Add section above" → `addSection('before', firstSectionId)`
- "Add section below" → `addSection('after', lastSectionId)`

## 5. LeafOverlay Behavior

When a leaf is inside a `GridColumn`:

- "left/right" → splits the leaf horizontally (SplitterNode inside the column)
- "top/bottom" → splits the leaf vertically (SplitterNode inside the column)

When a leaf is the direct child of a scroll section:

- "top/bottom" → adds a new section (existing behavior)
- "left/right" → splits horizontally (existing behavior)

## 6. LayoutRenderer Integration

```tsx
// renderNode
if (node.type === 'grid') return <GridLayout key={node.id} root={node} />;

// LayoutRenderer
{
  layoutMode === 'scroll' && root.type === 'scroll' ? (
    <ScrollLayout root={root} />
  ) : layoutMode === 'scroll' && root.type === 'grid' ? (
    <GridLayout root={root} />
  ) : (
    renderNode(root)
  );
}
```

## 7. Scroll Inside Grid

When `ScrollRoot` is a child of a `GridColumn`, it renders via `ScrollLayout` WITHOUT `nested` flag — no overflow, no inner scroll. The grid column stretches to content height, body scrolls.

This is the key difference from splitter: grid columns grow with content, splitter panels don't.

## 8. Scope

### In scope

- `GridRoot` + `GridColumn` types in `layout/types.ts`
- `GridLayout` component (CSS Grid rendering)
- `GridColumnHandle` component (horizontal drag resize)
- Store actions: `addGridColumn`, `removeGridColumn`, `resizeGridColumn`
- Toolbar "+" logic for wrap/extend GridRoot
- `renderNode` + `LayoutRenderer` support for `grid` type
- `treeUtils` support for grid nodes (findNode, updateNode, removeNode)

### Out of scope

- Migration of existing layouts (splitter root → grid root)
- Grid support in embed package (separate task)
- Drag-and-drop column reorder
- Nested grid (grid inside grid)
- localStorage auto-save changes (GridRoot serializes as JSON like other nodes)
