# Grid Overlay Design

## Overview

24-column semi-transparent grid overlay displayed over the layout canvas during edit mode. Similar to Figma's column grid — helps users align widgets and panels to a consistent grid system.

## Component: `GridOverlay`

**Location:** `src/layout/components/GridOverlay.tsx` + `GridOverlay.module.less`

**Rendering:** Placed inside `App.tsx` within `.canvas`, after `<LayoutRenderer />`. Absolutely positioned, `pointer-events: none`.

### SVG Pattern Approach

Single `<svg>` element covering 100% width/height of the canvas. Uses `<defs>` + `<pattern>` with `patternUnits="userSpaceOnUse"` to tile a single column+gutter unit across the viewport.

**Grid parameters:**
- 24 columns
- 16px gutter between columns
- Column width = `(containerWidth - 23 * 16) / 24`
- Column color: `rgba(24, 144, 255, 0.08)` (blue tint, low opacity)

**Dynamic sizing:** A `ResizeObserver` on the canvas container recalculates the pattern width and column width on resize. The SVG pattern dimensions are set via state to ensure pixel-accurate columns.

### Z-index

Uses a new token `@z-grid: 12` — above content (`@z-overlay: 10`) but below toolbar (`@z-toolbar: 20`) and resize handles (`@z-resize-handle: 25`).

## State

New fields in `layoutStore`:

```ts
// State
showGrid: boolean;  // default: false

// Actions
toggleGrid: () => void;
```

When `editMode` is set to `false`, `showGrid` is automatically reset to `false`.

## Controls

### Toolbar button
- Visible only when `editMode === true`
- Ant Design `Button` with grid icon (`AppstoreOutlined` or similar)
- Toggles `showGrid` on click
- Visual indication when grid is active (e.g. `type="primary"`)

### Keyboard shortcut
- `Ctrl+G` (or `Cmd+G` on macOS)
- Active only when `editMode === true`
- `useEffect` with `keydown` event listener in `App.tsx` or `GridOverlay`
- Calls `toggleGrid()`

## File structure

```
src/layout/components/GridOverlay.tsx         # Component
src/layout/components/GridOverlay.module.less  # Styles
```

Modified files:
- `src/layout/store/layoutStore.ts` — add `showGrid` + `toggleGrid`
- `src/App.tsx` — render `GridOverlay`, add toolbar button, add keyboard shortcut
- `src/themes/mixin.module.less` — add `@z-grid` token
