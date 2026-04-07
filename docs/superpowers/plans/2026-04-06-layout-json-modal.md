# Layout JSON Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toolbar button that opens a modal with two tabs — View (read-only JSON + copy/export) and Import (paste JSON to load layout).

**Architecture:** A single `LayoutJsonModal` component handles both tabs using antd `Modal` + `Tabs`. View tab reads from `useLayoutStore`, Import tab writes to it. Local state in App.tsx controls modal visibility.

**Tech Stack:** React 19, antd Modal/Tabs/Input.TextArea/Button/Typography, Zustand store read/write.

---

### Task 1: Create LayoutJsonModal component

**Files:**
- Create: `src/layout/components/LayoutJsonModal.tsx`

- [ ] **Step 1: Create LayoutJsonModal.tsx**

Create `src/layout/components/LayoutJsonModal.tsx`:

```tsx
import { useState, useCallback } from 'react';
import { Modal, Tabs, Input, Button, Typography, Space, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function downloadJson(json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `layout-${formatDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateLayout(data: unknown): data is { id: string; type: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    typeof (data as Record<string, unknown>).id === 'string' &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}

function ViewTab() {
  const root = useLayoutStore(s => s.root);
  const json = JSON.stringify(root, null, 2);
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      messageApi.success('Copied to clipboard');
    });
  }, [json, messageApi]);

  return (
    <>
      {contextHolder}
      <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12, margin: 0 }}>{json}</pre>
      <Space style={{ marginTop: 12 }}>
        <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy</Button>
        <Button icon={<DownloadOutlined />} onClick={() => downloadJson(json)}>Export</Button>
      </Space>
    </>
  );
}

function ImportTab({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = useCallback(() => {
    setError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('Invalid JSON');
      return;
    }
    if (!validateLayout(parsed)) {
      setError('Invalid layout: missing "id" or "type" field');
      return;
    }
    useLayoutStore.setState({ root: parsed as ReturnType<typeof useLayoutStore.getState>['root'] });
    setText('');
    onClose();
  }, [text, onClose]);

  return (
    <>
      <Input.TextArea
        rows={12}
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
        placeholder="Paste layout JSON here..."
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      {error && (
        <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </Typography.Text>
      )}
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" icon={<ImportOutlined />} onClick={handleImport} disabled={!text.trim()}>
          Import
        </Button>
      </Space>
    </>
  );
}

export function LayoutJsonModal({ open, onClose }: Props) {
  return (
    <Modal title="Layout JSON" open={open} onCancel={onClose} footer={null} width={640}>
      <Tabs
        items={[
          { key: 'view', label: 'View', children: <ViewTab /> },
          { key: 'import', label: 'Import', children: <ImportTab onClose={onClose} /> },
        ]}
      />
    </Modal>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds (component not yet mounted).

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/LayoutJsonModal.tsx
git commit -m "feat(json): create LayoutJsonModal with View and Import tabs"
```

---

### Task 2: Wire LayoutJsonModal into App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports and state**

In `src/App.tsx`, add imports:

```tsx
import { useState } from 'react';
import { CodeOutlined } from '@ant-design/icons';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
```

Update the existing `import { useEffect } from 'react'` to `import { useEffect, useState } from 'react'`.

Inside the `App` component, add local state:

```tsx
const [jsonModalOpen, setJsonModalOpen] = useState(false);
```

- [ ] **Step 2: Add toolbar button**

Add after the theme toggle button and before the Edit Mode button (between lines 68 and 69 in the current App.tsx):

```tsx
<Tooltip title="Layout JSON">
  <Button
    size="small"
    icon={<CodeOutlined />}
    onClick={() => setJsonModalOpen(true)}
  />
</Tooltip>
```

- [ ] **Step 3: Render modal**

Add the modal inside the `<ConfigProvider>`, after the closing `</div>` of `.app` (before the closing `</ConfigProvider>`):

```tsx
<LayoutJsonModal open={jsonModalOpen} onClose={() => setJsonModalOpen(false)} />
```

- [ ] **Step 4: Verify build, lint, and tests**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: All pass.

- [ ] **Step 5: Verify manually**

Run: `pnpm dev`
- Click the `</>` button in the toolbar
- Modal opens with "View" tab showing the current layout JSON
- Copy button copies to clipboard
- Export button downloads a `.json` file
- Switch to "Import" tab
- Paste valid JSON → Import button loads layout
- Paste invalid JSON → error message shown
- Modal closes after successful import

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(json): wire LayoutJsonModal button into App toolbar"
```
