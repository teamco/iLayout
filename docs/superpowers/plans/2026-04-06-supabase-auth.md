# Supabase Auth + TanStack Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase authentication (email+password, magic link, Google/GitHub OAuth) with TanStack Router for protected routes.

**Architecture:** Supabase client singleton connects to the hosted project. An `AuthContext` manages session state via `onAuthStateChange`. TanStack Router defines three code-based routes: `/login` (public), `/auth/callback` (OAuth handler), and `/` (protected layout builder). The root route wraps everything in `AuthProvider` + antd `ConfigProvider`.

**Tech Stack:** @supabase/supabase-js, @tanstack/react-router, React 19, antd 6, Zustand (existing theme store).

---

### Task 1: Install packages and create Supabase client

**Files:**

- Create: `src/lib/supabase.ts`
- Modify: `.gitignore`

- [ ] **Step 1: Install dependencies**

Run:

```bash
pnpm add @supabase/supabase-js @tanstack/react-router
```

- [ ] **Step 2: Add .env to .gitignore**

Append to `.gitignore`:

```
.env
.env.local
```

- [ ] **Step 3: Create Supabase client**

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY env vars',
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);
```

- [ ] **Step 4: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase.ts .gitignore package.json pnpm-lock.yaml
git commit -m "feat(auth): install supabase-js and tanstack router, create supabase client"
```

---

### Task 2: Create AuthContext

**Files:**

- Create: `src/auth/AuthContext.tsx`

- [ ] **Step 1: Create AuthContext.tsx**

Create `src/auth/AuthContext.tsx`:

```tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthContext.tsx
git commit -m "feat(auth): create AuthContext with session management"
```

---

### Task 3: Create LoginPage

**Files:**

- Create: `src/auth/LoginPage.tsx`

- [ ] **Step 1: Create LoginPage.tsx**

Create `src/auth/LoginPage.tsx`:

```tsx
import { useState } from 'react';
import {
  Card,
  Input,
  Button,
  Tabs,
  Divider,
  Typography,
  message,
  Space,
} from 'antd';
import {
  GoogleOutlined,
  GithubOutlined,
  MailOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { supabase } from '@/lib/supabase';

const { Text } = Typography;

function EmailPasswordTab() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
  }

  async function handleSignUp() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      message.success('Check your email to confirm your account');
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Input
        prefix={<MailOutlined />}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onPressEnter={handleSignIn}
      />
      <Input.Password
        prefix={<LockOutlined />}
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onPressEnter={handleSignIn}
      />
      {error && <Text type="danger">{error}</Text>}
      <Space>
        <Button type="primary" loading={loading} onClick={handleSignIn}>
          Sign In
        </Button>
        <Button loading={loading} onClick={handleSignUp}>
          Sign Up
        </Button>
      </Space>
    </Space>
  );
}

function MagicLinkTab() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return <Text type="success">Magic link sent! Check your email.</Text>;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Input
        prefix={<MailOutlined />}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onPressEnter={handleSend}
      />
      {error && <Text type="danger">{error}</Text>}
      <Button type="primary" loading={loading} onClick={handleSend}>
        Send Magic Link
      </Button>
    </Space>
  );
}

async function handleOAuth(provider: 'google' | 'github') {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin + '/auth/callback' },
  });
  if (error) message.error(error.message);
}

export function LoginPage() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}
    >
      <Card title="Sign In" style={{ width: 400 }}>
        <Tabs
          items={[
            { key: 'email', label: 'Email', children: <EmailPasswordTab /> },
            { key: 'magic', label: 'Magic Link', children: <MagicLinkTab /> },
          ]}
        />
        <Divider>or</Divider>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            block
            icon={<GoogleOutlined />}
            onClick={() => handleOAuth('google')}
          >
            Continue with Google
          </Button>
          <Button
            block
            icon={<GithubOutlined />}
            onClick={() => handleOAuth('github')}
          >
            Continue with GitHub
          </Button>
        </Space>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/auth/LoginPage.tsx
git commit -m "feat(auth): create LoginPage with email, magic link, and OAuth"
```

---

### Task 4: Create AuthCallback

**Files:**

- Create: `src/auth/AuthCallback.tsx`

- [ ] **Step 1: Create AuthCallback.tsx**

Create `src/auth/AuthCallback.tsx`:

```tsx
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Spin } from 'antd';
import { supabase } from '@/lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        navigate({ to: '/' });
      }
    });

    // Timeout fallback — if no auth event after 10s, redirect to login
    const timeout = setTimeout(() => {
      navigate({ to: '/login' });
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100dvh',
      }}
    >
      <Spin size="large" />
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/auth/AuthCallback.tsx
git commit -m "feat(auth): create AuthCallback for OAuth redirect handling"
```

---

### Task 5: Create router and refactor main.tsx + App.tsx

**Files:**

- Create: `src/router.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create router.tsx**

Create `src/router.tsx`:

```tsx
import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import { useThemeStore, syncSystemTheme } from '@/themes/themeStore';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function RootComponent() {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => syncSystemTheme();
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return (
    <AuthProvider>
      <ConfigProvider
        theme={{
          algorithm:
            resolvedTheme === 'dark'
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
        }}
      >
        <Outlet />
      </ConfigProvider>
    </AuthProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootComponent,
});

// Lazy import to avoid circular deps and keep App code-split
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
  component: () => {
    // Dynamic import would be ideal but inline for simplicity
    const App = require('@/App').default;
    return <App />;
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  async beforeLoad() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: '/' });
    }
  },
  component: () => {
    const { LoginPage } = require('@/auth/LoginPage');
    return <LoginPage />;
  },
});

const callbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/callback',
  component: () => {
    const { AuthCallback } = require('@/auth/AuthCallback');
    return <AuthCallback />;
  },
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  callbackRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

**Note:** The `require()` calls above are a quick approach but may cause issues with ESM. If the build fails, replace with direct imports:

```tsx
import App from '@/App';
import { LoginPage } from '@/auth/LoginPage';
import { AuthCallback } from '@/auth/AuthCallback';
```

And use `component: App`, `component: LoginPage`, `component: AuthCallback` directly on each route.

- [ ] **Step 2: Update main.tsx**

Replace the entire contents of `src/main.tsx` with:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
```

- [ ] **Step 3: Refactor App.tsx — remove ConfigProvider and theme sync effects**

In `src/App.tsx`, make these changes:

1. Remove the `ConfigProvider` wrapper and its import — it's now in the root route.
2. Remove the `theme` import from antd.
3. Remove theme-related imports (`useThemeStore`, `syncSystemTheme`, `SunOutlined`, `MoonOutlined`, `DesktopOutlined`).
4. Remove the theme store selectors (`themeMode`, `resolvedTheme`, `cycleTheme`).
5. Remove the two theme `useEffect` hooks (data-theme sync and matchMedia listener).
6. Remove the theme toggle button from the toolbar.
7. Keep everything else (layout, grid, JSON modal, edit mode).
8. Add a sign-out button to the toolbar.

The updated `src/App.tsx`:

```tsx
// src/App.tsx
import { useEffect, useState } from 'react';
import { Button, Tooltip } from 'antd';
import {
  AppstoreOutlined,
  CodeOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
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

export default function App() {
  const editMode = useLayoutStore((s) => s.editMode);
  const setEditMode = useLayoutStore((s) => s.setEditMode);
  const showGrid = useLayoutStore((s) => s.showGrid);
  const toggleGrid = useLayoutStore((s) => s.toggleGrid);
  const [jsonModalOpen, setJsonModalOpen] = useState(false);

  const themeMode = useThemeStore((s) => s.themeMode);
  const cycleTheme = useThemeStore((s) => s.cycleTheme);

  const { signOut } = useAuth();

  useEffect(() => {
    localStorageAdapter.load(LAYOUT_ID).then((saved) => {
      if (saved) useLayoutStore.setState({ root: saved });
    });
    return initAutoSave(LAYOUT_ID, localStorageAdapter);
  }, []);

  useEffect(() => {
    if (!editMode) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        toggleGrid();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, toggleGrid]);

  return (
    <div className={styles.app}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>Anthill Layouts</span>
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
        <Tooltip title="Sign out">
          <Button size="small" icon={<LogoutOutlined />} onClick={signOut} />
        </Tooltip>
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

- [ ] **Step 4: Verify build and tests**

Run: `pnpm build && pnpm test`
Expected: Build succeeds, tests pass.

- [ ] **Step 5: Verify manually**

Run: `pnpm dev`

- Navigate to `/` — should redirect to `/login` (no session)
- Login page shows email/password tab, magic link tab, Google/GitHub buttons
- Sign in with email+password → redirects to `/` with layout builder
- Sign out button → redirects to `/login`
- Navigate to `/login` while authenticated → redirects to `/`
- OAuth flow: click Google/GitHub → external redirect → callback → `/`

- [ ] **Step 6: Commit**

```bash
git add src/router.tsx src/main.tsx src/App.tsx
git commit -m "feat(auth): create router, wire auth flow, refactor App"
```
