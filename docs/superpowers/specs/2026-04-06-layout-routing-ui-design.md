# Layout Routing + Profile Table + Save Design

## Overview

Add routes for viewing/editing layouts from Supabase, a layouts table in the profile page, and a Save/Update button in the layout editor toolbar. The main page (`/`) is a placeholder for now.

## Routes

| Path                               | Component          | Auth      | Description                  |
| ---------------------------------- | ------------------ | --------- | ---------------------------- |
| `/`                                | `HomePage`         | Protected | Placeholder page             |
| `/users/:userId/layouts/new`       | `LayoutEditorPage` | Protected | Create new layout            |
| `/users/:userId/layouts/:layoutId` | `LayoutEditorPage` | Protected | Edit existing layout         |
| `/profile`                         | `ProfilePage`      | Protected | Existing — add layouts table |

## HomePage

**Location:** `src/pages/HomePage.tsx`

Simple placeholder page with a heading and a link to Profile → Layouts. Uses antd `Typography` and `Button` with `useNavigate`.

## LayoutEditorPage

**Location:** `src/pages/LayoutEditorPage.tsx`

Reads `userId` and `layoutId` from route params.

**Create mode** (`layoutId === 'new'`):

- Renders `App` with empty layout state
- Save button calls `useCreateLayout` mutation
- On success: navigates to `/users/:userId/layouts/:newId`

**Edit mode** (`layoutId !== 'new'`):

- Loads layout via `useLayout(layoutId)`
- Populates `useLayoutStore` with loaded `data`
- Save button calls `useSaveLayout` mutation (creates new version)
- Shows loading spinner while fetching

## App.tsx Refactor

`App` receives optional props:

```ts
type AppProps = {
  layoutId?: string;
  onSave?: () => void;
};
```

Changes:

- **Save button** in toolbar: `SaveOutlined` icon, visible when `editMode === true`, calls `onSave`
- Remove localStorage auto-save when `layoutId` is provided (Supabase is the source of truth)
- Keep localStorage logic as fallback when no `layoutId` (standalone mode)

## Profile Layouts Section

Modify `LayoutsSection` in `src/auth/ProfilePage.tsx`.

Antd `Table` with columns:

- **ID** — truncated uuid (first 8 chars), copyable
- **Status** — antd `Tag`: draft (blue), published (green), deleted (red)
- **Version** — number
- **Updated** — `formatDate(updated_at)`
- **Actions**:
  - **Edit** button → navigate to `/users/:userId/layouts/:id`
  - **Publish/Unpublish** button → `useSetStatus`
  - **Delete** button → antd `Popconfirm` → `useSetStatus(id, version, 'deleted')`

Table header: **"New Layout"** button → navigate to `/users/:userId/layouts/new`

Data source: `useLayouts(user.id)` from TanStack Query hooks.

## Router Changes

**Location:** `src/router.tsx`

Add routes:

- `/users/$userId/layouts/new` — `LayoutEditorPage`
- `/users/$userId/layouts/$layoutId` — `LayoutEditorPage`

Update index route (`/`) to render `HomePage` instead of `App`.

All new routes are protected (same `beforeLoad` session check pattern).

## File Structure

```
src/pages/
  HomePage.tsx              # Placeholder main page
  LayoutEditorPage.tsx      # Layout editor wrapper with Supabase load/save
```

Modified files:

- `src/App.tsx` — add Save button, accept props, conditional localStorage
- `src/auth/ProfilePage.tsx` — LayoutsSection with Table
- `src/router.tsx` — new routes, update index route
