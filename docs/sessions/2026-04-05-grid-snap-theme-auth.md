# Session: Grid Overlay, Snap-to-Grid, Theme Switcher, JSON Modal, Supabase Auth

**Date:** 2026-04-05 — 2026-04-06

## What was built

### Grid Overlay
- 24-column semi-transparent SVG grid overlay (`GridOverlay` component)
- Uses SVG `<pattern>` for memory efficiency
- Toggle via toolbar button (`AppstoreOutlined`) + `Ctrl+G` shortcut
- `showGrid` state in layoutStore, auto-resets when editMode turns off
- `GridContext` provides shared canvas dimensions via ResizeObserver

### Snap-to-Grid Resize
- Splitter resize snaps to global 24-column grid on drag end (`onResizeEnd`)
- Free resize during drag (`onResize`), snap only on release
- Pure `snapToGrid` utility with `getGridEdges` (both gutter sides)
- Nested splitters snap to same global grid via absolute canvas coordinates
- Min panel size: 1 column width, with iterative clamping

### Theme Switcher
- Three modes: light / dark / system
- Zustand store with localStorage persistence
- `data-theme` attribute on `<html>` drives CSS custom properties
- Less tokens (`@app-bg`, etc.) reference `var(--*)` — all components auto-theme
- Antd ConfigProvider switches algorithm per resolvedTheme
- Toolbar button cycles modes (sun/moon/desktop icons)

### Layout JSON Modal
- Toolbar button opens modal with View/Import tabs
- View: read-only JSON + Copy + Export (.json file)
- Import: paste JSON, validate, load into store

### Supabase Auth + TanStack Router
- `@supabase/supabase-js` + `@tanstack/react-router`
- AuthContext with session management via `onAuthStateChange`
- LoginPage: email+password, magic link, Google/GitHub OAuth
- AuthCallback: OAuth redirect handler with timeout fallback
- Code-based router: `/login` (public), `/auth/callback` (public), `/` (protected)
- Root route wraps AuthProvider + ConfigProvider + theme sync
- Sign out button in toolbar

## Key decisions
- SVG pattern over CSS gradient for grid (lower memory)
- Global grid (not per-panel) for consistent alignment
- Snap on drag end (not during) for smooth UX
- CSS custom properties bridge Less tokens to runtime theming
- Code-based TanStack Router (no file-based plugin for 3 routes)
- Chrome autofill dark mode fix via `-webkit-box-shadow` hack
- `data-theme` set synchronously at module load to prevent FOUC
