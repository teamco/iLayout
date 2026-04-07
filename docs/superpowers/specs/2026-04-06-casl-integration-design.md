# CASL Integration Design

## Overview

Replace the stubbed `useCanEdit()` with real CASL-based permissions. Three roles: admin (full access), editor (CRUD own layouts), viewer (view-only published). Admin determined by email in `VITE_ADMINS` env var. CASL conditions enforce ownership checks for editor role.

## Roles

| Role | Determination | Description |
|------|--------------|-------------|
| admin | Email in `VITE_ADMINS` | Full access to all layouts and actions |
| editor | Any authenticated user (default) | CRUD on own layouts only |
| viewer | Unauthenticated | View published layouts (enforced by Supabase RLS) |

## Actions & Subjects

**Location:** `src/auth/abilities.ts`

```ts
enum EAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  PUBLISH = 'publish',
  MANAGE = 'manage',
}

enum ESubject {
  LAYOUT = 'layout',
  ALL = 'all',
}
```

## Ability Rules

```
admin:
  can(MANAGE, ALL)

editor:
  can(VIEW, LAYOUT)
  can(CREATE, LAYOUT)
  can(EDIT, LAYOUT, { user_id: currentUserId })
  can(DELETE, LAYOUT, { user_id: currentUserId })
  can(PUBLISH, LAYOUT, { user_id: currentUserId })

viewer (no user):
  can(VIEW, LAYOUT)
```

Ownership enforced via CASL conditions — `{ user_id: currentUserId }` means the action is only allowed when `layout.user_id === currentUserId`.

## `defineAbilityFor(user)`

**Location:** `src/auth/abilities.ts`

Following the CBC pattern with `AbilityBuilder` + `createMongoAbility`:

```ts
function defineAbilityFor(user: User | null): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
  const isAdmin = user?.email && import.meta.env.VITE_ADMINS?.split(',').includes(user.email);

  if (isAdmin) {
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

## AbilityContext

**Location:** `src/auth/AbilityContext.tsx`

React context providing the CASL ability instance to the component tree.

- `AbilityProvider` wraps children, consumes `useAuth()` to get user, calls `defineAbilityFor(user)`, recalculates when user changes
- `useAbility()` hook returns the ability instance

## Integration Points

### `useCanEdit.ts`
Replace stub with:
```ts
const ability = useAbility();
return ability.can('edit', 'layout');
```
This returns `true` for admin (can manage all) and editor (can edit layouts). Returns `false` for viewer.

### `App.tsx`
- Edit Mode button: visible when `ability.can('edit', 'layout')`
- Save button: already gated by `editMode && onSave`

### `ProfilePage.tsx` (LayoutsSection)
- "New Layout" button: visible when `ability.can('create', 'layout')`
- "Edit" button: visible when `ability.can('edit', subject('layout', record))`
- "Publish/Unpublish" button: visible when `ability.can('publish', subject('layout', record))`
- "Delete" button: visible when `ability.can('delete', subject('layout', record))`

Uses CASL `subject()` helper to pass the actual layout record for ownership check.

### `router.tsx`
- Wrap `<Outlet />` in `<AbilityProvider>` (inside `AuthProvider`, after user is available)

## Environment

Add to `.env`:
```
VITE_ADMINS=teamco@gmail.com
```

Comma-separated list of admin emails.

## File Structure

```
src/auth/
  abilities.ts          # defineAbilityFor, EAction, ESubject, AppAbility type
  AbilityContext.tsx     # AbilityProvider + useAbility hook
```

Modified files:
- `src/layout/hooks/useCanEdit.ts` — replace stub with CASL check
- `src/App.tsx` — gate Edit Mode button with ability check
- `src/auth/ProfilePage.tsx` — gate CRUD buttons with ability + ownership checks
- `src/router.tsx` — add AbilityProvider
- `.env` — add VITE_ADMINS
