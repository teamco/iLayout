# Supabase Auth + TanStack Router Design

## Overview

Add authentication to the app using Supabase Auth with three sign-in methods (email+password, magic link, Google/GitHub OAuth). TanStack Router provides client-side routing with protected routes. Unauthenticated users see a login page; authenticated users access the layout builder.

## New Packages

- `@supabase/supabase-js` — Supabase client SDK
- `@tanstack/react-router` — type-safe React router

No Vite plugin needed — code-based routing for 3 simple routes.

## Supabase Client

**Location:** `src/lib/supabase.ts`

Singleton `createClient` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` from `.env`.

## Auth Context

**Location:** `src/auth/AuthContext.tsx`

React context providing auth state to the component tree.

State:
```ts
{
  session: Session | null;
  user: User | null;
  loading: boolean;
}
```

Provider behavior:
- On mount: calls `supabase.auth.getSession()` to restore session
- Subscribes to `supabase.auth.onAuthStateChange()` for real-time session updates (login, logout, token refresh)
- Cleans up subscription on unmount

Exports:
- `AuthProvider` — wraps children with context
- `useAuth()` — hook returning `{ session, user, loading, signOut }`
- `signOut()` calls `supabase.auth.signOut()` and redirects to `/login`

## Routes

Code-based routing (no file-based plugin). Three routes:

| Path | Component | Auth |
|------|-----------|------|
| `/` | `App` (current layout builder) | Protected — redirects to `/login` if no session |
| `/login` | `LoginPage` | Public — redirects to `/` if already authenticated |
| `/auth/callback` | `AuthCallback` | Public — handles OAuth code exchange |

**Location:** `src/router.tsx`

Root route renders `AuthProvider` + antd `ConfigProvider` (theme) + `Outlet`. Protected routes check session in `beforeLoad` and redirect to `/login` via `throw redirect()`.

## Login Page

**Location:** `src/auth/LoginPage.tsx`

Centered card with antd `Tabs`:

**Tab "Email":**
- Email + password inputs
- "Sign In" button — calls `supabase.auth.signInWithPassword()`
- "Sign Up" button — calls `supabase.auth.signUp()`
- Error messages displayed inline

**Tab "Magic Link":**
- Email input
- "Send Magic Link" button — calls `supabase.auth.signInWithOtp({ email })`
- Success message after sending

**OAuth section (below tabs):**
- `Divider` with "or"
- "Continue with Google" button — calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } })`
- "Continue with GitHub" button — same with `provider: 'github'`

Uses antd components: `Card`, `Input`, `Button`, `Tabs`, `Divider`, `Typography`, `message`.

## Auth Callback

**Location:** `src/auth/AuthCallback.tsx`

Handles OAuth redirect. Supabase JS auto-exchanges the code in the URL hash for a session on page load. Component:
1. Shows an antd `Spin` spinner
2. Listens to `onAuthStateChange` — on `SIGNED_IN` event, navigates to `/`
3. On error or timeout, navigates to `/login`

## Refactoring

### `src/main.tsx`
- Renders `RouterProvider` with the router instance instead of `<App />`

### `src/App.tsx`
- Removes `ConfigProvider` wrapper (moved to root route)
- Becomes the component for the `/` route
- Keeps all existing functionality (toolbar, layout, grid, etc.)

### `vite.config.ts`
- No changes needed — env vars prefixed with `VITE_` are auto-exposed

### `.gitignore`
- Ensure `.env` is listed

## Supabase Provider Setup

Google and GitHub OAuth providers need to be enabled in the Supabase dashboard (Authentication > Providers). The redirect URL must be configured as `https://kfttgjxvwiyzdekedhoy.supabase.co/auth/v1/callback`.

## File Structure

```
src/
  lib/
    supabase.ts              # Supabase client singleton
  auth/
    AuthContext.tsx           # Auth provider + useAuth hook
    LoginPage.tsx             # Login page with email/magic link/OAuth
    AuthCallback.tsx          # OAuth callback handler
  router.tsx                 # Route definitions + router instance
```

Modified files:
- `src/main.tsx` — RouterProvider instead of App
- `src/App.tsx` — remove ConfigProvider wrapper
