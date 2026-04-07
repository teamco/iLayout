# Scroll Layout UI (Plan B) Design

## Overview

UI components for scroll mode: ScrollLayout renderer, SectionNodeComponent, drag handle between sections, section config modal, mode switcher in toolbar, and conditional horizontal grid.

## ScrollLayout Component

**Location:** `src/layout/components/ScrollLayout.tsx`

Renders `ScrollRoot` — a scrollable container with vertically stacked sections.

```tsx
<div style={{ overflowY: 'auto', height: '100%' }}>
  {sections.map((section, i) => (
    <React.Fragment key={section.id}>
      {editMode && i === 0 && <AddSectionButton position="before" targetId={section.id} />}
      <SectionNodeComponent section={section} />
      {editMode && <SectionHandle sectionAboveId={section.id} />}
      {editMode && <AddSectionButton position="after" targetId={section.id} />}
    </React.Fragment>
  ))}
</div>
```

Props: `root: ScrollRoot`

Reads `editMode` from `useLayoutStore`.

## SectionNodeComponent

**Location:** `src/layout/components/SectionNodeComponent.tsx`

Renders a single section as a `<div>` with:
- `width: 100%`
- `height` / `min-height` based on `SectionHeight.type`:
  - `auto` → no explicit height (grows with content)
  - `fixed` → `height: value` (e.g. "500px", "100vh")
  - `min` → `min-height: value`
- `margin-top` from `section.overlap` (can be negative for overlapping)
- `z-index` from `section.zIndex`
- `position: relative` (for z-index stacking context)
- `overflow: hidden` within section

Content: `renderNode(section.child)` — renders the section's inner LayoutNode (leaf or splitter).

In edit mode: gear icon (SettingOutlined) in top-right corner → opens SectionConfig modal. Subtle dashed border to indicate section boundaries.

## SectionHandle

**Location:** `src/layout/components/SectionHandle.tsx`

Horizontal drag handle between sections. Visible only in edit mode.

Visual: thin horizontal bar (4px height, full width, subtle color). Cursor: `ns-resize`.

Behavior:
- Pointer down → start tracking
- Pointer move → calculate delta, update section height via `resizeSection`
- Pointer up → snap height to horizontal grid edge via `snapToNearestEdge`
- Disabled when section above has `height.type === 'auto'`

## SectionConfig Modal

**Location:** `src/layout/components/SectionConfig.tsx`

Antd Modal with Form:
- **Height type:** Select (auto / fixed / min)
- **Height value:** InputNumber + unit selector (px / vh / %) — disabled when type is `auto`
- **Overlap:** InputNumber with px suffix (margin-top, can be negative)
- **Z-index:** InputNumber
- **Save / Cancel** buttons

## LayoutRenderer Update

**Location:** `src/layout/components/LayoutRenderer.tsx`

Read `layoutMode` from store. Switch rendering:
- `viewport` → existing `renderNode(root)` (no changes)
- `scroll` → `<ScrollLayout root={root as ScrollRoot} />`

## GridOverlay Update

**Location:** `src/layout/components/GridOverlay.tsx`

Read `layoutMode` from `useLayoutStore`. Only render horizontal row pattern when `layoutMode === 'scroll'`. Vertical column pattern always renders.

## App.tsx Canvas Update

**Location:** `src/App.tsx`

Read `layoutMode` from store. When `scroll`:
- `.canvas` gets `overflow-y: auto` instead of `overflow: hidden`

## Mode Selection (at creation time only)

Mode is chosen when creating a layout and cannot be changed after.

**Location:** `src/pages/profile/LayoutsSection.tsx`

Replace the "New Layout" button with an antd `Dropdown.Button`:
- Default click → create viewport layout (existing behavior)
- Dropdown menu:
  - **Viewport** → navigate to `/layouts/new?mode=viewport`
  - **Scroll** → navigate to `/layouts/new?mode=scroll`

**Location:** `src/pages/LayoutEditorPage.tsx`

Read `mode` from URL search params on create. Pass to `createLayout` mutation. Store sets `layoutMode` from loaded layout data.

**Location:** `src/pages/HomePage.tsx`

Same dropdown pattern for "Create New Layout" button.

No mode switcher in the editor toolbar — mode is immutable after creation.

## File Structure

New files:
```
src/layout/components/ScrollLayout.tsx
src/layout/components/SectionNodeComponent.tsx
src/layout/components/SectionHandle.tsx
src/layout/components/SectionConfig.tsx
```

Modified files:
- `src/layout/components/LayoutRenderer.tsx`
- `src/layout/components/GridOverlay.tsx`
- `src/App.tsx` — scrollable canvas for scroll mode
- `src/pages/profile/LayoutsSection.tsx` — dropdown for mode selection
- `src/pages/LayoutEditorPage.tsx` — read mode from URL, pass to create
- `src/pages/HomePage.tsx` — dropdown for mode selection
