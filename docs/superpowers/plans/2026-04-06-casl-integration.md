# CASL Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the CASL stub with real role-based permissions (admin/editor/viewer) using `@casl/ability` + `@casl/react`.

**Architecture:** `defineAbilityFor(user)` builds a CASL ability based on user role (admin via env var, editor for authenticated, viewer for anonymous). `AbilityContext` provides it to the tree. `Can` component from `@casl/react` wraps UI elements. `useCanEdit` hook replaced with real ability check.

**Tech Stack:** @casl/ability (already installed), @casl/react (already installed), React Context.

---

### Task 1: Create abilities definition + AbilityContext + Can component

**Files:**

- Create: `src/auth/abilities.ts`
- Create: `src/auth/AbilityContext.tsx`
- Create: `src/auth/Can.tsx`

- [ ] **Step 1: Add VITE_ADMINS to .env**

Append to `.env`:

```
VITE_ADMINS=teamco@gmail.com
```

- [ ] **Step 2: Create abilities.ts**

Create `src/auth/abilities.ts`:

```ts
import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability';
import type { User } from '@supabase/supabase-js';

export const EAction = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  PUBLISH: 'publish',
  MANAGE: 'manage',
} as const;
export type EAction = (typeof EAction)[keyof typeof EAction];

export const ESubject = {
  LAYOUT: 'layout',
  ALL: 'all',
} as const;
export type ESubject = (typeof ESubject)[keyof typeof ESubject];

export type AppAbility = MongoAbility<[EAction, ESubject | string]>;

function isAdmin(email?: string): boolean {
  if (!email) return false;
  const admins = (import.meta.env.VITE_ADMINS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export function defineAbilityFor(user: User | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (user && isAdmin(user.email)) {
    can(EAction.MANAGE, ESubject.ALL);
  } else if (user) {
    can(EAction.VIEW, ESubject.LAYOUT);
    can(EAction.CREATE, ESubject.LAYOUT);
    can(EAction.EDIT, ESubject.LAYOUT, { user_id: user.id });
    can(EAction.DELETE, ESubject.LAYOUT, { user_id: user.id });
    can(EAction.PUBLISH, ESubject.LAYOUT, { user_id: user.id });
  } else {
    can(EAction.VIEW, ESubject.LAYOUT);
  }

  return build();
}
```

- [ ] **Step 3: Create AbilityContext.tsx**

Create `src/auth/AbilityContext.tsx`:

```tsx
import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { MongoAbility } from '@casl/ability';
import { useAuth } from '@/auth/AuthContext';
import { defineAbilityFor, type AppAbility } from '@/auth/abilities';

export const AbilityContext = createContext<AppAbility | null>(null);

export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability)
    throw new Error('useAbility must be used within AbilityProvider');
  return ability;
}

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const ability = useMemo(() => defineAbilityFor(user), [user]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}
```

- [ ] **Step 4: Create Can.tsx**

Create `src/auth/Can.tsx`:

```tsx
import { createContextualCan } from '@casl/react';
import type { AnyAbility } from '@casl/ability';
import type { Consumer } from 'react';
import { AbilityContext } from '@/auth/AbilityContext';

export const Can = createContextualCan(
  AbilityContext.Consumer as Consumer<AnyAbility>,
);
```

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/auth/abilities.ts src/auth/AbilityContext.tsx src/auth/Can.tsx .env
git commit -m "feat(casl): create abilities, AbilityContext, and Can component"
```

---

### Task 2: Wire AbilityProvider into router

**Files:**

- Modify: `src/router.tsx`

- [ ] **Step 1: Add AbilityProvider to RootComponent**

In `src/router.tsx`, add import:

```tsx
import { AbilityProvider } from '@/auth/AbilityContext';
```

In the `RootComponent` return, wrap `<AntApp>` with `<AbilityProvider>` (inside `AuthProvider` so user is available):

Change:

```tsx
      <AuthProvider>
        <ConfigProvider theme={{...}}>
          <AntApp>
            <Outlet />
          </AntApp>
        </ConfigProvider>
      </AuthProvider>
```

To:

```tsx
      <AuthProvider>
        <AbilityProvider>
          <ConfigProvider theme={{...}}>
            <AntApp>
              <Outlet />
            </AntApp>
          </ConfigProvider>
        </AbilityProvider>
      </AuthProvider>
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/router.tsx
git commit -m "feat(casl): wire AbilityProvider into root route"
```

---

### Task 3: Replace useCanEdit stub

**Files:**

- Modify: `src/layout/hooks/useCanEdit.ts`

- [ ] **Step 1: Replace stub with real CASL check**

Replace the entire contents of `src/layout/hooks/useCanEdit.ts`:

```ts
import { useAbility } from '@/auth/AbilityContext';
import { EAction, ESubject } from '@/auth/abilities';

export function useCanEdit(): boolean {
  const ability = useAbility();
  return ability.can(EAction.EDIT, ESubject.LAYOUT);
}
```

- [ ] **Step 2: Verify build and tests**

Run: `pnpm build && pnpm test`
Expected: Both pass.

- [ ] **Step 3: Commit**

```bash
git add src/layout/hooks/useCanEdit.ts
git commit -m "feat(casl): replace useCanEdit stub with real ability check"
```

---

### Task 4: Gate App.tsx toolbar buttons with abilities

**Files:**

- Modify: `src/App.tsx`

- [ ] **Step 1: Add ability imports and hook**

In `src/App.tsx`, add imports:

```tsx
import { useAbility } from '@/auth/AbilityContext';
import { EAction, ESubject } from '@/auth/abilities';
```

Inside the `App` component, add after existing hooks:

```tsx
const ability = useAbility();
const canEdit = ability.can(EAction.EDIT, ESubject.LAYOUT);
```

- [ ] **Step 2: Gate Edit Mode button**

Wrap the Edit Mode button so it only renders when `canEdit`:

Change:

```tsx
<Button
  type={editMode ? 'primary' : 'default'}
  size="small"
  onClick={() => setEditMode(!editMode)}
>
  {editMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
</Button>
```

To:

```tsx
{
  canEdit && (
    <Button
      type={editMode ? 'primary' : 'default'}
      size="small"
      onClick={() => setEditMode(!editMode)}
    >
      {editMode ? '✏️ Edit Mode ON' : 'Edit Mode'}
    </Button>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(casl): gate Edit Mode button with ability check"
```

---

### Task 5: Gate ProfilePage layout actions with abilities

**Files:**

- Modify: `src/auth/ProfilePage.tsx`

- [ ] **Step 1: Add ability imports**

In `src/auth/ProfilePage.tsx`, add imports:

```tsx
import { useAbility } from '@/auth/AbilityContext';
import { EAction, ESubject } from '@/auth/abilities';
import { subject } from '@casl/ability';
```

- [ ] **Step 2: Add ability hook inside LayoutsSection**

Inside the `LayoutsSection` function, add after existing hooks:

```tsx
const ability = useAbility();
```

- [ ] **Step 3: Gate "New Layout" button**

Wrap the "New Layout" button:

Change:

```tsx
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate({...})}
        >
          New Layout
        </Button>
```

To:

```tsx
        {ability.can(EAction.CREATE, ESubject.LAYOUT) && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate({...})}
          >
            New Layout
          </Button>
        )}
```

- [ ] **Step 4: Gate action buttons in table**

In the Actions column render function, wrap each button with ability checks using `subject()`:

```tsx
render: (_: unknown, record: LayoutRecord) => {
  const layoutSubject = subject(ESubject.LAYOUT, record);
  return (
    <span style={{ display: 'flex', gap: 8 }}>
      {ability.can(EAction.EDIT, layoutSubject) && (
        <Button size="small" onClick={() => navigate({...})}>
          Edit
        </Button>
      )}
      {ability.can(EAction.PUBLISH, layoutSubject) && record.status === 'draft' && (
        <Button size="small" onClick={() => setStatus.mutate({...})}>
          Publish
        </Button>
      )}
      {ability.can(EAction.PUBLISH, layoutSubject) && record.status === 'published' && (
        <Button size="small" onClick={() => setStatus.mutate({...})}>
          Unpublish
        </Button>
      )}
      {ability.can(EAction.DELETE, layoutSubject) && (
        <Popconfirm title="Delete this layout?" onConfirm={() => setStatus.mutate({...})}>
          <Button size="small" danger>Delete</Button>
        </Popconfirm>
      )}
    </span>
  );
},
```

Note: `subject(ESubject.LAYOUT, record)` creates a CASL subject instance so the condition `{ user_id: user.id }` is checked against `record.user_id`. For admin users, `can(MANAGE, ALL)` bypasses all conditions.

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 6: Verify manually**

Run: `pnpm dev`

- Login as teamco@gmail.com (admin) → all buttons visible on all layouts
- Login as another user (editor) → Edit Mode visible, CRUD only on own layouts
- Check that non-owner layouts show no Edit/Delete/Publish buttons

- [ ] **Step 7: Commit**

```bash
git add src/auth/ProfilePage.tsx
git commit -m "feat(casl): gate layout CRUD actions with ability + ownership checks"
```
