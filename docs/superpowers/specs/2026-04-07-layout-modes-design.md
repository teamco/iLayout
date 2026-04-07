# Layout Modes Design

## Overview

Add two layout modes: `viewport` (current behavior — everything fits in screen) and `scroll` (sections-based, vertical scroll, pushable). Users choose mode per layout. Includes horizontal grid overlay, section drag handles, overlap support, and section config.

## LayoutMode Type

```ts
type LayoutMode = 'viewport' | 'scroll';
```

Added to `LayoutRecord` with default `'viewport'` for backward compatibility.

## Viewport Mode

No changes — 100dvh, splitter divides space, everything within screen bounds.

## Scroll Mode

### Data Model

Root layout in scroll mode = ordered array of `SectionNode`:

```ts
type SectionHeight =
  | { type: 'auto' }                    // grows with content
  | { type: 'fixed'; value: string }    // "500px", "100vh", "50%"
  | { type: 'min'; value: string };     // min-height, grows if needed

type SectionNode = {
  id: string;
  type: 'section';
  height: SectionHeight;
  child: LayoutNode;           // section content (leaf or splitter)
  overlap?: string;            // negative margin-top, e.g. "-50px"
  zIndex?: number;
};
```

`LayoutNode` union updated: `LeafNode | SplitterNode | SectionNode`

In scroll mode, `root` is a special container holding `SectionNode[]` — stored as:
```ts
type ScrollRoot = {
  id: string;
  type: 'scroll';
  sections: SectionNode[];
};
```

`LayoutNode` becomes: `LeafNode | SplitterNode | SectionNode | ScrollRoot`

### Visual Layout

```
[AppHeader]
<scrollable container>
  [Section 1: height=100vh]
    └── SplitterNode (horizontal)
         ├── [LeafNode: Hero]
         └── [LeafNode: CTA]

  [Section 2: height=auto, overlap=-30px, zIndex=2]
    └── LeafNode: Overlapping content card

  [Section 3: height=500px]
    └── SplitterNode (horizontal)
         ├── [Widget A]
         ├── [Widget B]
         └── [Widget C]

  [Section 4: height=auto]
    └── LeafNode: Footer
</scrollable container>
```

### Section Rendering

Each section renders as a `<div>` with:
- `width: 100%` (constrained to viewport width)
- `height` / `min-height` based on `SectionHeight` type
- `margin-top` from `overlap` (allows negative for overlapping sections)
- `z-index` from `zIndex`
- `position: relative` (for z-index stacking)
- `overflow: hidden` within section

Content inside section = standard `LayoutNode` (leaf or horizontal splitter). Horizontal divisions within a section are constrained to viewport width.

### Drag Handle Between Sections

Horizontal bar between sections (visible in edit mode). Drag up/down changes the height of the section above.

Behavior:
- **Pushable** — dragging does NOT compress the neighbor, it pushes all sections below
- When `height.type === 'auto'` — handle disabled (height determined by content)
- When `height.type === 'fixed'` or `'min'` — handle enabled
- Snaps to horizontal grid on drag end

### Adding Sections

"+" buttons at top and bottom edges of each section (in edit mode):
- Top "+" → insert empty section above
- Bottom "+" → insert empty section below
- New section: `{ height: { type: 'auto' }, child: { id, type: 'leaf' } }`

### Section Config

In edit mode, clicking a section header/edge opens config (modal or inline panel):
- **Height type:** Select (auto / fixed / min)
- **Height value:** InputNumber with px/vh/% selector (disabled when auto)
- **Overlap:** InputNumber with px suffix (margin-top, can be negative)
- **Z-index:** InputNumber
- Background color/image — future extension

### Horizontal Grid Overlay

24-row grid overlay (complements existing 24-column vertical grid):
- Horizontal lines across the viewport height
- Row height = `canvasHeight / 24`
- Semi-transparent lines (`rgba(24, 144, 255, 0.08)`) — same pattern as vertical
- Snap-to-grid for section height drag handles
- Toggle: same grid button toggles both vertical + horizontal

## Switching Modes

In layout editor toolbar or layout settings — Select: Viewport / Scroll.

### Conversion logic

**Viewport → Scroll:**
- Wrap existing root `LayoutNode` in a single `SectionNode` with `height: { type: 'fixed', value: '100vh' }`
- Create `ScrollRoot` with one section

**Scroll → Viewport:**
- Take first section's `child` as the new root
- Other sections are lost — show confirmation dialog before converting

## Store Actions

New actions in `layoutStore`:

```ts
// Section management (scroll mode only)
addSection: (position: 'before' | 'after', targetSectionId: string) => void;
removeSection: (sectionId: string) => void;
resizeSection: (sectionId: string, height: SectionHeight) => void;
updateSectionConfig: (sectionId: string, config: Partial<SectionNode>) => void;
reorderSections: (fromIndex: number, toIndex: number) => void;

// Mode switching
setLayoutMode: (mode: LayoutMode) => void;
```

## Database Migration

Add `mode` column to `layouts` table:
```sql
alter table layouts add column mode text not null default 'viewport' check (mode in ('viewport', 'scroll'));
```

## File Structure

New files:
```
src/layout/components/ScrollLayout.tsx      # Scroll mode root renderer
src/layout/components/SectionNode.tsx       # Section component
src/layout/components/SectionHandle.tsx     # Drag handle between sections
src/layout/components/SectionConfig.tsx     # Section config modal/panel
```

Modified files:
- `src/layout/types.ts` — add LayoutMode, SectionNode, ScrollRoot, SectionHeight
- `src/layout/components/LayoutRenderer.tsx` — switch by mode
- `src/layout/store/layoutStore.ts` — section actions, mode switching
- `src/layout/grid/GridOverlay.tsx` — add horizontal grid lines
- `src/layout/grid/GridContext.tsx` — provide canvasHeight for horizontal grid
- `src/App.tsx` — scrollable canvas for scroll mode
- `src/lib/types.ts` — add LayoutMode to LayoutRecord

Migration via Supabase MCP.
