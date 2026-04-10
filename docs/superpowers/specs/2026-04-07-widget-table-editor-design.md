# Profile Widgets Table + Widget Editor Design

## Overview

Replace the widgets placeholder in `/profile/widgets` with a full CRUD table (same pattern as layouts). Add a widget editor page at `/widgets/new` and `/widgets/:widgetId/edit` with form tabs for general info, content, config (CSS), and settings.

## Profile WidgetsSection

**Location:** `src/pages/profile/WidgetsSection.tsx`

Antd `Table` following the LayoutsSection pattern:

### Columns (`src/pages/profile/widgetColumns.tsx`)

| Column   | DataIndex    | Features                                                                            |
| -------- | ------------ | ----------------------------------------------------------------------------------- |
| Name     | `name`       | sortable, filterable                                                                |
| Category | `category`   | Tag (color-coded), filterable                                                       |
| Resource | `resource`   | Tag, filterable                                                                     |
| Status   | `status`     | Tag (draft=blue, published=green, deleted=red), filterable                          |
| Public   | `is_public`  | Icon (LockOutlined/GlobalOutlined), filterable                                      |
| Updated  | `updated_at` | sortable, concealable                                                               |
| Created  | `created_at` | sortable, concealable, hidden by default                                            |
| Actions  | —            | Dropdown: Edit, Publish/Unpublish, Toggle Public, Delete (Popconfirm). Fixed right. |

### Toolbar

- **New Widget** button → navigate to `/widgets/new` (gated by `<Can>`)
- Refresh + Export JSON (via GridToolbar)
- HideColumns (via useColumnsToggle)

### Table features

- `useTable` with `persistToUrl: true` for sort/filter/pagination URL sync
- `useWidgets(user.id)` for data
- `useDeleteWidget` + `useUpdateWidget` for actions
- `useColumnsToggle` with `created_at` hidden by default
- CASL: actions gated via `<Can>` with `subject()` for ownership

## Widget Editor Page

**Location:** `src/pages/WidgetEditorPage.tsx`

Full-screen page with `AppHeader` and antd `Form`.

### Modes

- **Create** (`/widgets/new`): empty form, `useCreateWidget` on save
- **Edit** (`/widgets/:widgetId/edit`): load via `useWidget(id)`, `useUpdateWidget` on save

### Form layout

antd `Form` with `layout="vertical"` inside `Tabs`:

**Tab "General":**

- `name` — Input
- `description` — TextArea
- `category` — Select (EWidgetCategory values)
- `resource` — Select (EWidgetResource values)
- `tags` — Select with `mode="tags"`

**Tab "Content":**

- `content.value` — TextArea (URL for youtube/image, code/text for others)
- `thumbnail` — Input (URL)

**Tab "Config":**

- `config.isEditable` — Switch
- `config.isClonable` — Switch
- CSS margins — reuse pattern from WidgetConfigModal (CssValueField with Space.Compact)

**Tab "Settings":**

- `is_public` — Switch
- Status info (read-only display: current status, created/updated dates)

### Toolbar

`AppHeader` with Save and Cancel buttons as children.

### Error handling

- `useErrorNotification` for load/create/update errors
- Form validation via antd Form rules

## Routes

**Location:** `src/routes.ts` + `src/router.tsx`

```ts
WIDGET_NEW: '/widgets/new',
WIDGET_EDIT: '/widgets/$widgetId/edit',
```

Both protected routes (requireAuth).

## File Structure

```
src/pages/
  profile/
    WidgetsSection.tsx          # Replace placeholder with table
    widgetColumns.tsx           # Column definitions
  WidgetEditorPage.tsx          # Widget editor (create + edit)
```

Modified files:

- `src/routes.ts` — add WIDGET_NEW, WIDGET_EDIT
- `src/router.tsx` — add routes
- `src/pages/profile/WidgetsSection.tsx` — full rewrite
