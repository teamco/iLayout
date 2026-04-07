# Architecture

## System Overview

```
Browser
  |
  +-- React 19 SPA (Vite)
  |     |
  |     +-- TanStack Router (code-based, protected routes)
  |     +-- TanStack Query (server state, caching)
  |     +-- Zustand + Immer (client state)
  |     +-- Ant Design 6 (UI components)
  |     +-- CASL (role-based permissions)
  |     +-- i18next (EN, RU, HE + RTL)
  |
  +-- Supabase
        +-- Auth (email, magic link, Google, GitHub OAuth)
        +-- PostgreSQL (layouts, widgets, profiles)
        +-- Row Level Security (RLS)
```

## Routing

```
/                                    HomePage (placeholder)
/login                               LoginPage (email, magic link, OAuth)
/auth/callback                       AuthCallback (OAuth redirect handler)
/profile                             ProfilePage (layout with sidebar + Outlet)
  /profile/overview                  OverviewSection
  /profile/                          ProfileSection (user info)
  /profile/layouts                   LayoutsSection (CRUD table)
  /profile/widgets                   WidgetsSection (CRUD table)
  /profile/users                     UsersSection (admin only)
/layouts/new                         LayoutEditorPage (create)
/layouts/:layoutId                   LayoutEditorPage (edit)
/widgets/new                         WidgetEditorPage (create)
/widgets/:widgetId/edit              WidgetEditorPage (edit)
/users/:userId                       UserProfilePage
/users/:userId/layouts/:layoutId     LayoutEditorPage (view other's layout)
```

All routes except `/login` and `/auth/callback` are protected via `requireAuth` in `beforeLoad`.

## Authentication Flow

```
User opens app
  |
  +-- Router beforeLoad checks supabase.auth.getSession()
  |     |
  |     +-- No session --> redirect to /login
  |     +-- Session exists --> render route
  |
  +-- AuthProvider wraps app tree
  |     +-- getSession() on mount
  |     +-- onAuthStateChange listener
  |     +-- Sets is_online=true in profiles table
  |
  +-- On sign out:
  |     +-- setOnlineStatus(false)
  |     +-- supabase.auth.signOut()
  |
  +-- On tab close (beforeunload):
        +-- fetch PATCH with keepalive (is_online=false)
```

## Authorization (CASL)

### Roles

| Role | Determination | Capabilities |
|------|--------------|-------------|
| Admin | Email in `VITE_ADMINS` | `can(MANAGE, ALL)` — full access |
| Editor | Any authenticated user | CRUD own layouts/widgets with ownership check |
| Viewer | Unauthenticated | View published layouts/widgets only |

### Subjects

- `LAYOUT` — layout CRUD with `{ user_id }` condition
- `WIDGET` — widget CRUD with `{ user_id }` condition
- `ALL` — admin wildcard

### Usage

```tsx
// In JSX — declarative
<Can I={EAction.EDIT} this={subject(ESubject.LAYOUT, record)}>
  <Button>Edit</Button>
</Can>

// In data/logic — imperative
const ability = useAbility();
if (ability.can(EAction.MANAGE, ESubject.ALL)) { ... }
```

## Database Schema

### Tables

```
layouts
  id          uuid PK
  user_id     uuid FK -> auth.users
  version     integer (composite PK with id)
  status      draft | published | deleted
  data        jsonb (LayoutNode tree)
  is_private  boolean
  + IEntityMeta (created_at, created_by, updated_at, updated_by)

widgets
  id          uuid PK
  user_id     uuid FK -> auth.users
  name        text
  description text
  thumbnail   text
  content     jsonb { value: string }
  category    media | data | content | embed | utility
  resource    youtube | image | iframe | component | empty
  config      jsonb { isEditable, isClonable, css? }
  tags        text[]
  status      draft | published | deleted
  is_public   boolean
  + IEntityMeta

profiles
  id              uuid PK FK -> auth.users
  email, full_name, avatar_url, provider
  is_online       boolean
  is_blocked      boolean
  last_sign_in_at timestamptz
  + timestamps
```

### RLS Policies

- **Layouts:** Owner sees all own. Authenticated see published. Owner CRUD.
- **Widgets:** Owner sees all own. Authenticated see public+published. Owner CRUD.
- **Profiles:** All authenticated can view. Owner can update own.

### Versioning (Layouts)

Each save creates a new row with `version + 1`. Same `id`, different `version`. Only one version per layout can be `published`.

## Layout Builder

### Layout Modes

Two modes, chosen at layout creation (immutable after):

- **`viewport`** — everything fits in screen, splitter divides space (dashboards)
- **`scroll`** — sections-based, vertical scroll, pushable (landing pages)

Mode stored in `LayoutRecord.mode` and `layoutStore.layoutMode`.

### Data Model

```
LayoutMode = 'viewport' | 'scroll'

LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot

LeafNode {
  id: string
  type: 'leaf'
  widget?: WidgetRef
}

SplitterNode {
  id: string
  type: 'splitter'
  direction: 'horizontal' | 'vertical'
  sizes: number[]     // percentages, sum = 100
  children: LayoutNode[]
}

SectionNode {
  id: string
  type: 'section'
  height: SectionHeight   // auto | fixed | min
  child: LayoutNode       // section content
  overlap?: string        // negative margin-top for overlapping
  zIndex?: number
}

ScrollRoot {
  id: string
  type: 'scroll'
  sections: SectionNode[]
}

WidgetRef {
  widgetId: string
  resource: EWidgetResource
  content: { value: string }
  config: Record<string, unknown>
  bounds?: WidgetBounds   // CSS margins + align via inset
}
```

### Global Panel Adding (Scroll Mode)

- **Top/Bottom** from toolbar "+" → `addSection` (page grows, scrollable)
- **Left/Right** from toolbar "+" → wraps entire root in horizontal splitter (global column)
- **Left/Right** from panel "+" → splitter within section (local column)

### State Management

```
Zustand layoutStore
  root: LayoutNode            # layout tree (SplitterNode or ScrollRoot)
  editMode: boolean           # global edit toggle
  showGrid: boolean           # 24-col + 24-row grid overlay
  layoutMode: LayoutMode      # viewport or scroll
  activeWidgetEditId: string | null  # per-widget config mode
  galleryTargetId: string | null     # panel awaiting widget from gallery
  + actions (addPanel, removePanel, setWidget, resize, setLayoutMode,
             addSection, removeSection, resizeSection, etc.)
```

### Grid System

- **Vertical:** 24-column grid overlay (SVG pattern) — always visible
- **Horizontal:** 24-row grid overlay — visible only in scroll mode
- Splitter resize snaps to vertical grid on drag end (`onResizeEnd`)
- Section height snaps to horizontal grid via `snapToNearestEdge`
- `GridContext` provides canvas dimensions (width, height, columns, rows, gutters) via ResizeObserver
- `snapToGrid` / `getHorizontalGridEdges` / `snapToNearestEdge` pure utilities

### Scroll Mode Components

- `ScrollLayout` — scrollable container rendering sections + handles
- `SectionNodeComponent` — individual section with configurable height/overlap/z-index
- `SectionHandle` — drag handle between sections for height resize
- `SectionConfig` — modal for section settings (height type, value, overlap, z-index)

### Widget Bounds (CSS)

Margins stored as CSS values (`"10px"`, `"5%"`). Applied via `position: absolute; inset: top right bottom left` on the widget container.

## Widget System

### Directory Structure

```
src/widgets/
  types.ts          # WidgetDefinition, WidgetComponentProps, WidgetEditorProps
  registry.ts       # registerWidget, getWidgetDef, getAllWidgetDefs
  init.ts           # side-effect imports (loaded in main.tsx)
  empty/            # EmptyWidget
  youtube/          # YouTubeWidget + YouTubeEditor
  image/            # ImageWidget + ImageEditor
```

### WidgetDefinition

Each widget type provides:
- `component` — renders the widget in the layout
- `editor` (optional) — custom content editor in WidgetConfigModal
- `icon`, `label`, `description` — for gallery display
- `defaultContent`, `defaultConfig` — initial values

### Adding a New Widget

1. Create `src/widgets/<name>/` with `definition.ts`, `<Name>Widget.tsx`, optionally `<Name>Editor.tsx`, and `index.ts`
2. In `index.ts`: `import { registerWidget } from '../registry'; registerWidget(definition);`
3. Add `import './<name>';` to `src/widgets/init.ts`
4. Add resource type to `EWidgetResource` in `src/lib/types.ts`
5. Add DB check constraint via Supabase migration

## Theming

```
Theme Store (Zustand)
  themeMode: 'light' | 'dark' | 'system'
  resolvedTheme: 'light' | 'dark'
  cycleTheme()

CSS Custom Properties
  :root, [data-theme="light"] { --app-bg: #fff; ... }
  [data-theme="dark"] { --app-bg: #0d0d0d; ... }

Less Tokens
  @app-bg: var(--app-bg);  // bridge Less → CSS variables

Ant Design
  ConfigProvider algorithm: darkAlgorithm | defaultAlgorithm
  ConfigProvider direction: 'ltr' | 'rtl' (per language)
```

`data-theme` attribute set synchronously at module load (before first render) to prevent FOUC.

## Shared Components

### AppHeader
Global toolbar with language selector, theme toggle, user avatar dropdown. Pages pass extra buttons via `children`.

### PageLayout
Wraps page content with title, CASL access check (`<Can>` / `AccessDenied`), loading spinner, optional description/extras.

### Table Utilities
- `useTable` — pagination, sort, filter state with URL persistence
- `useColumnsToggle` — show/hide columns
- `GridToolbar` — toolbar with refresh, export, custom children
- `columnFilter` / `columnSorter` — filter/sort config generators
- `TableFooter` — "Showing X of Y" footer

## Data Flow

```
Supabase DB
  |
  layoutApi / widgetApi / profileApi    (pure async functions)
  |
  useLayoutQueries / useWidgetQueries   (TanStack Query hooks)
  |
  React Components                      (useQuery / useMutation)
  |
  Zustand Store                         (layout tree for real-time editing)
  |
  WidgetRenderer                        (reads registry + renders component)
```
