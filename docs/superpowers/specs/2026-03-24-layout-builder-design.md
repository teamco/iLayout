# Layout Builder Design

**Date:** 2026-03-24
**Status:** Approved

## Overview

A widget-based layout builder using Ant Design's `Splitter` component. Users can compose dashboards from resizable, nestable panels. Each panel holds a widget from a gallery (chart, table, iframe, embed, etc.). The layout is serialized as a JSON tree and persisted via a swappable storage adapter (localStorage now, Firebase later).

Two edit modes exist:
- **Layout edit mode** — global toggle; resize/add/remove panels, drag widgets between panels
- **Widget edit mode** — per-panel, entered via double-click; configure the widget inside the panel

CASL permissions are stubbed (`can('manage', 'all')`) until authentication is introduced.

---

## Data Model

```typescript
type WidgetBounds = {
  width?: number | string;      // px or '%', undefined = 100%
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  align?: 'top-left' | 'top-center' | 'top-right'
        | 'center-left' | 'center' | 'center-right'
        | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

type WidgetRef = {
  widgetId: string;
  type: 'iframe' | 'component' | 'embed';
  config: Record<string, unknown>;
  bounds?: WidgetBounds;        // undefined = stretch to fill panel
};

type LeafNode = {
  id: string;
  type: 'leaf';
  widget?: WidgetRef;           // undefined = empty panel
};

type SplitterNode = {
  id: string;
  type: 'splitter';
  direction: 'horizontal' | 'vertical';
  sizes: number[];              // percentages, sum = 100
  children: LayoutNode[];       // minimum 2
};

type LayoutNode = LeafNode | SplitterNode;

type LayoutStore = {
  root: LayoutNode;
  editMode: boolean;
  maxDepth: number;             // 0 = unlimited, default 5
};
```

### Split logic

When the user adds a panel in a direction from a leaf node:
- **Left / Right** → horizontal split
- **Up / Down** → vertical split
- If the parent splitter already matches the direction → insert sibling next to current node
- Otherwise → wrap the current leaf in a new splitter of the required direction
- New panel gets 50% of the current panel's size

---

## Architecture

```
src/layout/
  store/
    layoutStore.ts          # Zustand + Immer: root, editMode, maxDepth
    layoutActions.ts        # addPanel, removePanel, setWidget, resize, swapWidgets
  components/
    LayoutRenderer.tsx      # recursive LayoutNode renderer
    SplitterNode.tsx        # renders <Splitter> with children
    LeafNode.tsx            # renders panel + widget inside
    LeafOverlay.tsx         # edit mode overlay (+ button, drag handle, ✕)
    AddPanelModal.tsx       # modal with 4 direction arrows
  widgets/
    WidgetGallery.tsx       # gallery drawer: browse and pick widgets
    WidgetRenderer.tsx      # renders iframe / component / embed by type
    widgetRegistry.ts       # registry of available widget definitions
  hooks/
    useLayoutNode.ts        # find node + parent by id
    useCanEdit.ts           # CASL stub (always true for now)
  utils/
    treeUtils.ts            # updateNode, findNode, getDepth, splitNode
  storage/
    types.ts                # LayoutStorage interface
    localStorageAdapter.ts  # current implementation
    firebaseAdapter.ts      # future implementation (API already exists)
```

### Data flow

```
layoutStore (Zustand + Immer)
  └─ LayoutRenderer            ← reads root
       └─ SplitterNode         ← renders <Splitter direction={...}>
            └─ LeafNode        ← renders widget + overlay in edit mode
                 ├─ LeafOverlay → AddPanelModal → addPanel action
                 │             → WidgetGallery  → setWidget action
                 └─ (double-click) → widget edit mode
```

---

## Edit Modes

### Layout edit mode (global)

Toggled via a button in the top bar. When active:
- Every `LeafNode` shows a blue dashed border + **+** button (center) + **✕** (top-right corner)
- Splitter dividers become draggable (Ant Design handles this natively)
- Drag handles appear on each panel for widget DnD
- Double-clicking a panel enters **widget edit mode**

### Widget edit mode (per-panel)

Entered via double-click on a panel. When active:
- Selected panel gets a yellow border and a small **"⚙ Widget Edit / Done"** toolbar at the top
- All other panels are dimmed and non-interactive
- Widget `bounds` resize handle appears (bottom-right corner)
- For iframe widgets: the iframe itself is non-interactive; config (URL, params) shown in toolbar
- Double-clicking an empty panel skips widget edit and opens the widget gallery directly
- Exit: click **Done** or press **ESC** → returns to layout edit mode

---

## Drag & Drop

Library: **`@dnd-kit/core`**

DnD is only active in layout edit mode.

| Scenario | Behavior |
|---|---|
| Gallery → empty panel | Widget is placed in the panel |
| Gallery → occupied panel | Widget replaces existing (old widget discarded) |
| Panel → empty panel | Widget moves; source panel becomes empty |
| Panel → occupied panel | Widgets swap |

Implementation notes:
- Each `LeafNode` is both `useDraggable` and `useDroppable`
- Gallery items are `useDraggable` only
- Drop zones highlight green (empty target) or yellow (swap)
- `pointer-events: none` applied to iframes during active drag
- Drag is initiated from the drag handle icon to avoid conflicting with panel content

---

## Storage Adapter

```typescript
// src/layout/storage/types.ts
interface LayoutStorage {
  load(layoutId: string): Promise<LayoutNode>;
  save(layoutId: string, root: LayoutNode): Promise<void>;
}
```

Auto-save: `debounce(store.save, 1000)` triggered on every tree mutation. No manual save button needed.

Current implementation: `localStorageAdapter`. Firebase adapter to be added when the existing Firebase API is connected.

---

## Permissions (CASL)

`useCanEdit` hook returns `true` unconditionally until authentication is added.

Future replacement:
```typescript
const ability = useAbility(AbilityContext);
return ability.can('edit', 'Layout');
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `antd` 6+ | Splitter, Modal, Drawer, Button |
| `zustand` | Global state store |
| `immer` | Immutable tree updates via mutations |
| `@dnd-kit/core` | Drag and drop |
| `@casl/ability` + `@casl/react` | Permission checks (stubbed) |

---

## Configuration

| Parameter | Default | Notes |
|---|---|---|
| `maxDepth` | `5` | Max nesting depth; `0` = unlimited |

---

## Out of Scope (this iteration)

- Authentication and real CASL abilities
- Firebase storage adapter
- Undo / redo
- Panel animations
- Widget-to-widget communication
