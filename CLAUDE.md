# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Type-check then bundle (tsc -b && vite build)
pnpm lint         # Run ESLint
pnpm preview      # Preview production build
pnpm test         # Run tests (vitest)
```

## Architecture

Minimal React 19 + TypeScript + Vite SPA. Entry: `index.html` → `src/main.tsx` → `src/App.tsx`.

- **Build tool:** Vite 8 with `@vitejs/plugin-react` (Oxc-based JSX transform)
- **TypeScript:** Strict mode, ES2023 target, split config (`tsconfig.app.json` for app code, `tsconfig.node.json` for build tools)
- **ESLint:** Flat config (`eslint.config.js`) with TypeScript, react-hooks, and react-refresh rules
- **Package manager:** pnpm

CSS uses custom properties for light/dark theming via `prefers-color-scheme`. Global styles in `src/index.css`, component styles in `src/App.css`.

### Layout Builder (`src/layout/`)

Widget-based layout builder using Ant Design `Splitter`. Recursive `LayoutNode` JSON tree (`LeafNode | SplitterNode`) stored in Zustand + Immer. Layout auto-saved to localStorage via debounced adapter. DnD via `@dnd-kit/core`. Two edit modes: global layout edit and per-panel widget edit (double-click).

```
src/layout/
  store/         # Zustand + Immer store + actions
  components/    # LayoutRenderer, SplitterNode, LeafNode, LeafOverlay, AddPanelModal
  widgets/       # WidgetGallery, WidgetRenderer, widgetRegistry
  dnd/           # DndContext, DragActiveContext, usePanelDnd
  hooks/         # useCanEdit (CASL stub), useLayoutNode
  storage/       # LayoutStorage interface, localStorageAdapter, autoSave
  utils/         # treeUtils (pure functions: findNode, getDepth, splitNode, removeNode, updateNode)
```

## Key Libraries

- **Ant Design 6+** — UI component library. Use `antd` components directly; theme customization via `ConfigProvider`. Prefer Ant Design components over custom ones for all UI elements.
- **CASL** (`@casl/ability`, `@casl/react`) — permission/authorization manager. Currently stubbed: `useCanEdit()` returns `true` unconditionally until auth is added.
- **@dnd-kit/core** — drag-and-drop. DnD active only when `editMode === true && activeWidgetEditId === null`.
- **nanoid** — ID generation for new layout nodes.

## Rules

### API versions

Before using any component or prop from a library, verify it exists in the **installed version** (check `package.json`). Do not use APIs from older versions. In particular:

- antd 6: `Drawer` uses `size` (`'default' | 'large'`), not `width`. `Card.Meta` is removed — use `Typography.Text` directly. `Splitter` uses `orientation`, not `layout`.

### Test files

All test files go in a `__tests__/` subfolder next to the module they test. Imports inside `__tests__/` use `../` to reach the module under test.

### After implementation

When a feature is fully implemented and tests pass:

1. Update `docs/superpowers/specs/` with any design changes.
2. Save a short summary to `docs/superpowers/plans/` or a dedicated `docs/sessions/YYYY-MM-DD-<feature>.md` describing what was built, key decisions, and anything non-obvious.
