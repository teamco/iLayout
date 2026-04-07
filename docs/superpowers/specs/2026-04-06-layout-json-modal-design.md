# Layout JSON Modal Design

## Overview

A toolbar button opens a modal with two tabs: "View" (read-only JSON of the current layout with copy/export) and "Import" (paste JSON to load a layout). Provides a way to inspect, export, and import layout configurations.

## Component: `LayoutJsonModal`

**Location:** `src/layout/components/LayoutJsonModal.tsx`

Props:
```ts
type LayoutJsonModalProps = {
  open: boolean;
  onClose: () => void;
};
```

### Tab "View"

- Reads `root` from `useLayoutStore`
- Displays `JSON.stringify(root, null, 2)` in a styled `<pre>` block with overflow scroll
- **Copy button:** copies JSON string to clipboard via `navigator.clipboard.writeText()`
- **Export button:** creates a Blob, generates a download link, triggers click. Filename: `layout-YYYY-MM-DD.json`

### Tab "Import"

- `Input.TextArea` (antd) for pasting JSON, with local state
- **Import button:** parses the textarea value with `JSON.parse()`, validates minimally (checks `id` and `type` fields exist on the root object), then calls `useLayoutStore.setState({ root: parsed })`
- On parse error or validation failure: displays an inline error message (antd `Typography.Text` with `type="danger"`) below the textarea
- On success: clears the textarea, closes the modal

### Modal config

- antd `Modal` with `footer={null}` (custom footer per tab)
- antd `Tabs` with two items: "View" and "Import"
- Size: `'large'` (antd 6 Drawer/Modal size prop)

## Toolbar Button

- Icon: `CodeOutlined` from `@ant-design/icons`
- Tooltip: "Layout JSON"
- Position: after theme button, before Edit Mode button
- Always visible (not gated by editMode)
- onClick: sets local `jsonModalOpen` state to `true`

## State

Local state only in `App.tsx`:
- `const [jsonModalOpen, setJsonModalOpen] = useState(false)`

No global store changes needed.

## File Structure

- **Create:** `src/layout/components/LayoutJsonModal.tsx`
- **Modify:** `src/App.tsx` — add button + render modal
