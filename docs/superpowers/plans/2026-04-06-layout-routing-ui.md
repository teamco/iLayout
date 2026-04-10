# Layout Routing + Profile Table + Save Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add layout editor routes, a layouts table in the profile, and a Save button in the editor toolbar — all backed by the Supabase layoutApi.

**Architecture:** `HomePage` is a placeholder for `/`. `LayoutEditorPage` wraps the existing `App` component and handles Supabase load/save via TanStack Query hooks. `App` gains a `Save` button and optional props for external persistence. Profile's `LayoutsSection` shows an antd Table with CRUD actions.

**Tech Stack:** TanStack Router (params), TanStack Query (hooks), antd Table/Tag/Popconfirm, existing layoutApi + Zustand store.

---

### Task 1: Create HomePage placeholder

**Files:**

- Create: `src/pages/HomePage.tsx`

- [ ] **Step 1: Create HomePage.tsx**

Create `src/pages/HomePage.tsx`:

```tsx
import { Typography, Button } from 'antd';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/auth/AuthContext';

const { Title, Text } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
        gap: 16,
      }}
    >
      <Title level={2}>Widgets</Title>
      <Text type="secondary">Your layout dashboard is coming soon.</Text>
      {user && (
        <Button
          type="primary"
          onClick={() =>
            navigate({
              to: '/users/$userId/layouts/new',
              params: { userId: user.id },
            })
          }
        >
          Create New Layout
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds (not mounted yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(layout): create HomePage placeholder"
```

---

### Task 2: Refactor App.tsx — add Save button and props

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Add props and Save button**

Replace the entire `src/App.tsx` with:

```tsx
// src/App.tsx
import { useEffect, useState } from 'react';
import md5 from 'blueimp-md5';
import { Avatar, Button, Dropdown, Tooltip, Typography, message } from 'antd';
import type { MenuProps } from 'antd';
import {
  AppstoreOutlined,
  CodeOutlined,
  LogoutOutlined,
  SaveOutlined,
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useThemeStore } from '@/themes/themeStore';
import { useAuth } from '@/auth/AuthContext';
import { LayoutRenderer } from '@/layout/components/LayoutRenderer';
import { GridOverlay } from '@/layout/components/GridOverlay';
import { GridProvider } from '@/layout/grid/GridContext';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { initAutoSave } from '@/layout/storage/autoSave';
import { localStorageAdapter } from '@/layout/storage/localStorageAdapter';
import { LayoutJsonModal } from '@/layout/components/LayoutJsonModal';
import styles from './App.module.less';

const LAYOUT_ID = 'default';

type AppProps = {
  layoutId?: string;
  onSave?: () => void;
  saving?: boolean;
};

export default function App({ layoutId, onSave, saving }: AppProps) {
  const editMode = useLayoutStore((s) => s.editMode);
  const setEditMode = useLayoutStore((s) => s.setEditMode);
  const showGrid = useLayoutStore((s) => s.showGrid);
  const toggleGrid = useLayoutStore((s) => s.toggleGrid);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  const themeMode = useThemeStore((s) => s.themeMode);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const userName = user?.user_metadata?.full_name || user?.email || 'User';
  const providerAvatar = user?.user_metadata?.avatar_url;
  const [avatarError, setAvatarError] = useState(false);

  const gravatarUrl = user?.email
    ? `https://www.gravatar.com/avatar/${md5(user.email.trim().toLowerCase())}?d=identicon&s=64`
    : undefined;

  const avatarSrc = avatarError ? gravatarUrl : providerAvatar;

  const lastSignIn = user?.last_sign_in_at
    ? new Date(user.last_sign_in_at).toLocaleString()
    : undefined;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      type: 'group',
      label: userName,
    },
    ...(lastSignIn
      ? [
          {
            key: 'lastLogin',
            label: (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Last login: {lastSignIn}
              </Typography.Text>
            ),
            disabled: true,
          },
        ]
      : []),
    { type: 'divider' as const },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate({ to: '/profile' }),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign out',
      onClick: signOut,
    },
  ];

  // Only use localStorage auto-save when not in Supabase mode
  useEffect(() => {
    if (layoutId) return;
    localStorageAdapter.load(LAYOUT_ID).then((saved) => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    return initAutoSave(LAYOUT_ID, localStorageAdapter);
  }, [layoutId]);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, toggleGrid, onSave]);

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Widgets</span>
        <div className={styles.toolbarSpacer} />
        <Tooltip
          title={
            themeMode === 'light'
              ? 'Light'
              : themeMode === 'dark'
                ? 'Dark'
                : 'System'
          }
        >
          <Button
            size="small"
            icon={
              themeMode === 'light' ? (
                <SunOutlined />
              ) : themeMode === 'dark' ? (
                <MoonOutlined />
              ) : (
                <DesktopOutlined />
              )
            }
            onClick={cycleTheme}
          />
        </Tooltip>
        <Tooltip title="Layout JSON">
          <Button
            size="small"
            icon={<CodeOutlined />}
            onClick={() => setJsonModalOpen(true)}
          />
        </Tooltip>
        <Button
          type={editMode ? 'primary' : 'default'}
          size="small"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
        </Button>
        {editMode && onSave && (
          <Tooltip title="Save (Ctrl+S)">
            <Button
              size="small"
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={onSave}
            />
          </Tooltip>
        )}
        {editMode && (
          <Tooltip title="Toggle grid (Ctrl+G)">
            <Button
              type={showGrid ? 'primary' : 'default'}
              size="small"
              icon={<AppstoreOutlined />}
              onClick={toggleGrid}
            />
          </Tooltip>
        )}
        <Dropdown
          menu={{ items: userMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Avatar
            size="small"
            src={
              avatarSrc ? (
                <img
                  src={avatarSrc}
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : undefined
            }
            icon={!avatarSrc ? <UserOutlined /> : undefined}
            style={{ cursor: 'pointer' }}
          />
        </Dropdown>
      </div>
      <div className={styles.canvas}>
        <GridProvider>
          <LayoutRenderer />
          {showGrid && <GridOverlay />}
        </GridProvider>
      </div>
      <LayoutJsonModal
        open={jsonModalOpen}
        onClose={() => setJsonModalOpen(false)}
      />
    </div>
  );
}
```

Key changes from current:

- Added `AppProps` type: `layoutId?`, `onSave?`, `saving?`
- localStorage auto-save skipped when `layoutId` is provided
- Save button visible when `editMode && onSave`
- Ctrl+S shortcut calls `onSave`
- Added `SaveOutlined` import and `message` import

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(layout): add Save button and props to App component"
```

---

### Task 3: Create LayoutEditorPage

**Files:**

- Create: `src/pages/LayoutEditorPage.tsx`

- [ ] **Step 1: Create LayoutEditorPage.tsx**

Create `src/pages/LayoutEditorPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Spin, message } from 'antd';
import App from '@/App';
import { useLayoutStore } from '@/layout/store/layoutStore';
import {
  useLayout,
  useCreateLayout,
  useSaveLayout,
} from '@/lib/hooks/useLayoutQueries';

export function LayoutEditorPage() {
  const { userId, layoutId } = useParams({ strict: false }) as {
    userId: string;
    layoutId: string;
  };
  const navigate = useNavigate();
  const isNew = layoutId === 'new';

  const { data: layout, isLoading } = useLayout(isNew ? undefined : layoutId);
  const createMutation = useCreateLayout();
  const saveMutation = useSaveLayout();

  // Load layout data into Zustand store when fetched
  useEffect(() => {
    if (layout?.data) {
      useLayoutStore.setState({ root: layout.data });
    }
  }, [layout]);

  // Reset store for new layouts
  useEffect(() => {
    if (isNew) {
      useLayoutStore.setState({
        root: { id: crypto.randomUUID(), type: 'leaf' },
      });
      useLayoutStore.getState().setEditMode(true);
    }
  }, [isNew]);

  function handleSave() {
    const root = useLayoutStore.getState().root;

    if (isNew) {
      createMutation.mutate(root, {
        onSuccess: (created) => {
          message.success('Layout created');
          navigate({
            to: '/users/$userId/layouts/$layoutId',
            params: { userId, layoutId: created.id },
          });
        },
        onError: (err) => message.error(err.message),
      });
    } else {
      saveMutation.mutate(
        { id: layoutId, data: root },
        {
          onSuccess: () => message.success('Layout saved'),
          onError: (err) => message.error(err.message),
        },
      );
    }
  }

  if (!isNew && isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100dvh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <App
      layoutId={isNew ? undefined : layoutId}
      onSave={handleSave}
      saving={createMutation.isPending || saveMutation.isPending}
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds (not mounted yet).

- [ ] **Step 3: Commit**

```bash
git add src/pages/LayoutEditorPage.tsx
git commit -m "feat(layout): create LayoutEditorPage with Supabase load/save"
```

---

### Task 4: Update Profile LayoutsSection with Table

**Files:**

- Modify: `src/auth/ProfilePage.tsx`

- [ ] **Step 1: Replace LayoutsSection**

In `src/auth/ProfilePage.tsx`, replace the `LayoutsSection` function and add needed imports.

Add to imports at the top:

```tsx
import { Button, Table, Tag, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useLayouts, useSetStatus } from '@/lib/hooks/useLayoutQueries';
import { formatDate } from '@/lib/formatDate';
import type { LayoutRecord } from '@/lib/types';
```

Update the existing antd import to include `Button`, `Table`, `Tag`, `Popconfirm` (merge with existing `Avatar, Descriptions, Menu, Typography`):

```tsx
import {
  Avatar,
  Button,
  Descriptions,
  Menu,
  Popconfirm,
  Table,
  Tag,
  Typography,
} from 'antd';
```

Replace the `LayoutsSection` function with:

```tsx
function LayoutsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: layouts, isLoading } = useLayouts(user?.id);
  const setStatus = useSetStatus();

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Typography.Text copyable style={{ fontSize: 12 }}>
          {id.slice(0, 8)}
        </Typography.Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color =
          status === 'published'
            ? 'green'
            : status === 'draft'
              ? 'blue'
              : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Version',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: LayoutRecord) => (
        <span style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            onClick={() =>
              navigate({
                to: '/users/$userId/layouts/$layoutId',
                params: { userId: user!.id, layoutId: record.id },
              })
            }
          >
            Edit
          </Button>
          {record.status === 'draft' && (
            <Button
              size="small"
              onClick={() =>
                setStatus.mutate({
                  id: record.id,
                  version: record.version,
                  status: 'published',
                })
              }
            >
              Publish
            </Button>
          )}
          {record.status === 'published' && (
            <Button
              size="small"
              onClick={() =>
                setStatus.mutate({
                  id: record.id,
                  version: record.version,
                  status: 'draft',
                })
              }
            >
              Unpublish
            </Button>
          )}
          <Popconfirm
            title="Delete this layout?"
            onConfirm={() =>
              setStatus.mutate({
                id: record.id,
                version: record.version,
                status: 'deleted',
              })
            }
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Layouts
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            navigate({
              to: '/users/$userId/layouts/new',
              params: { userId: user!.id },
            })
          }
        >
          New Layout
        </Button>
      </div>
      <Table
        dataSource={layouts ?? []}
        columns={columns}
        rowKey={(r) => `${r.id}-${r.version}`}
        loading={isLoading}
        pagination={false}
        size="small"
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/auth/ProfilePage.tsx
git commit -m "feat(layout): add layouts table with CRUD to ProfilePage"
```

---

### Task 5: Update router with new routes

**Files:**

- Modify: `src/router.tsx`

- [ ] **Step 1: Add imports and routes**

In `src/router.tsx`, add import:

```tsx
import { HomePage } from '@/pages/HomePage';
import { LayoutEditorPage } from '@/pages/LayoutEditorPage';
```

Change the `indexRoute` component from `App` to `HomePage`:

```tsx
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  async beforeLoad() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: HomePage,
});
```

Remove the `import App from '@/App'` line (no longer used in router).

Add two new routes before `callbackRoute`:

```tsx
const layoutNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/layouts/new',
  async beforeLoad() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: LayoutEditorPage,
});

const layoutEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users/$userId/layouts/$layoutId',
  async beforeLoad() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: LayoutEditorPage,
});
```

Update the route tree:

```tsx
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  profileRoute,
  layoutNewRoute,
  layoutEditRoute,
  callbackRoute,
]);
```

- [ ] **Step 2: Verify build and tests**

Run: `pnpm build && pnpm test`
Expected: Both pass.

- [ ] **Step 3: Verify manually**

Run: `pnpm dev`

- `/` shows HomePage placeholder with "Create New Layout" button
- Click "Create New Layout" → navigates to `/users/:userId/layouts/new`
- Layout editor opens in edit mode with empty layout
- Click Save → creates layout in Supabase, URL changes to `/users/:userId/layouts/:id`
- Navigate to Profile → Layouts → table shows the layout
- Click Edit → opens layout editor with loaded data
- Click Publish → status changes to published
- Click Delete → confirmation → soft delete
- Click "New Layout" in profile → creates another layout

- [ ] **Step 4: Commit**

```bash
git add src/router.tsx
git commit -m "feat(layout): add layout editor routes and update index to HomePage"
```
