# Theme Switcher Design

## Overview

Add a three-mode theme switcher (light / dark / system) to the toolbar. Clicking cycles through modes. The app currently uses hardcoded dark tokens in Less and a fixed `darkAlgorithm` in antd's ConfigProvider. This feature introduces a theme store, CSS custom properties for theme-sensitive tokens, and syncs both antd and custom styles to the selected theme.

## Theme Store

**Location:** `src/themes/themeStore.ts`

Zustand store (no Immer needed — simple flat state):

```ts
type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

type ThemeState = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  cycleTheme: () => void;
};
```

- `themeMode` default: `'system'`
- `cycleTheme()` cycles: light → dark → system → light
- `resolvedTheme` is derived: for `'light'`/`'dark'` it matches `themeMode`; for `'system'` it resolves via `matchMedia('(prefers-color-scheme: dark)')`
- Persist `themeMode` to localStorage key `'theme-mode'`
- On init, read from localStorage; if absent, default to `'system'`

### Media listener

A `useThemeSync` hook (exported from `themeStore.ts`) runs in App.tsx:
1. Sets `document.documentElement.dataset.theme` to `resolvedTheme` (drives CSS custom properties)
2. Listens to `matchMedia('(prefers-color-scheme: dark)')` changes — when `themeMode === 'system'`, updates `resolvedTheme` accordingly
3. Runs on mount and whenever `themeMode` changes

## CSS Custom Properties

**Location:** `src/index.css`

Replace the current `prefers-color-scheme` media query approach with `[data-theme]` attribute selectors on `:root`:

```css
:root, [data-theme="light"] {
  --app-bg: #fff;
  --border-dark: #e5e4e7;
  --border-dim: #d9d9d9;
  --color-white: #1a1a1a;     /* inverted: text color in light mode */
  --color-muted: #999;
  --color-dim: #888;
  --drag-card-bg: #e8f0fe;
}

[data-theme="dark"] {
  --app-bg: #0d0d0d;
  --border-dark: #222;
  --border-dim: #333;
  --color-white: #fff;
  --color-muted: #555;
  --color-dim: #666;
  --drag-card-bg: #1e2a3a;
}
```

Theme-agnostic tokens (same in both themes) stay as Less variables:
- `@color-blue: #1890ff`
- `@color-yellow: #faad14`
- `@color-green: #52c41a`
- `@z-*` tokens

## Less Token Migration

**Location:** `src/themes/mixin.module.less`

Theme-sensitive tokens change from hardcoded values to CSS custom property references:

```less
@app-bg:       var(--app-bg);
@border-dark:  var(--border-dark);
@border-dim:   var(--border-dim);
@color-white:  var(--color-white);
@color-muted:  var(--color-muted);
@color-dim:    var(--color-dim);
@drag-card-bg: var(--drag-card-bg);
```

Theme-agnostic tokens remain unchanged:
```less
@color-blue:   #1890ff;
@color-yellow: #faad14;
@color-green:  #52c41a;
```

All `.module.less` consumer files keep using `@token` syntax — no changes needed in them. The Less compiler resolves `@app-bg` to `var(--app-bg)`, which the browser resolves at runtime.

## Antd ConfigProvider

In `App.tsx`, switch the algorithm based on `resolvedTheme`:

```tsx
const { resolvedTheme } = useThemeStore();
// ...
<ConfigProvider theme={{ algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
```

## Toolbar Button

- Always visible (not gated by editMode)
- Positioned before the Edit Mode button (left side of button group)
- Icon cycles with mode:
  - `'light'` → `SunOutlined`
  - `'dark'` → `MoonOutlined`
  - `'system'` → `DesktopOutlined`
- Tooltip shows current mode name: "Light" / "Dark" / "System"
- Click calls `cycleTheme()`

## File Structure

```
src/themes/
  themeStore.ts              # Zustand store + useThemeSync hook
  mixin.module.less          # Modified: theme-sensitive tokens → var()
```

Modified files:
- `src/index.css` — [data-theme] selectors instead of prefers-color-scheme
- `src/App.tsx` — toolbar button, ConfigProvider algorithm, useThemeSync()
