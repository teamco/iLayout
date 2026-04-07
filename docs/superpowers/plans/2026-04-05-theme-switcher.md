# Theme Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a three-mode theme switcher (light/dark/system) with toolbar button, CSS custom properties, and antd algorithm switching.

**Architecture:** A Zustand theme store holds `themeMode` (persisted to localStorage) and `resolvedTheme`. A `useThemeSync` hook sets `data-theme` on `<html>` and listens to `matchMedia` for system preference changes. Theme-sensitive Less tokens reference CSS custom properties defined in `index.css` via `[data-theme]` selectors. Antd's ConfigProvider switches algorithm based on `resolvedTheme`.

**Tech Stack:** Zustand, CSS custom properties, matchMedia API, antd ConfigProvider + theme algorithms, Less.

---

### Task 1: Create theme store with tests

**Files:**
- Create: `src/themes/themeStore.ts`
- Create: `src/themes/__tests__/themeStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/themes/__tests__/themeStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to system mode', () => {
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
  });

  it('cycles light → dark → system → light', () => {
    const store = createThemeStore();
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('light');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('dark');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('system');
    store.getState().cycleTheme();
    expect(store.getState().themeMode).toBe('light');
  });

  it('resolves light/dark directly', () => {
    const store = createThemeStore();
    store.getState().cycleTheme(); // → light
    expect(store.getState().resolvedTheme).toBe('light');
    store.getState().cycleTheme(); // → dark
    expect(store.getState().resolvedTheme).toBe('dark');
  });

  it('resolves system to dark when matchMedia matches', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
    expect(store.getState().resolvedTheme).toBe('dark');
    vi.unstubAllGlobals();
  });

  it('resolves system to light when matchMedia does not match', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('system');
    expect(store.getState().resolvedTheme).toBe('light');
    vi.unstubAllGlobals();
  });

  it('persists themeMode to localStorage', () => {
    const store = createThemeStore();
    store.getState().cycleTheme(); // → light
    expect(localStorage.getItem('theme-mode')).toBe('light');
  });

  it('restores themeMode from localStorage', () => {
    localStorage.setItem('theme-mode', 'dark');
    const store = createThemeStore();
    expect(store.getState().themeMode).toBe('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/themes/__tests__/themeStore.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement theme store**

Create `src/themes/themeStore.ts`:

```ts
import { create, createStore } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ThemeState = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  cycleTheme: () => void;
};

const CYCLE: ThemeMode[] = ['light', 'dark', 'system'];
const STORAGE_KEY = 'theme-mode';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  return mode === 'system' ? getSystemTheme() : mode;
}

function loadMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && CYCLE.includes(stored as ThemeMode)) return stored as ThemeMode;
  } catch { /* ignore */ }
  return 'system';
}

function persistMode(mode: ThemeMode) {
  try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
}

function makeStore(initialMode?: ThemeMode) {
  const mode = initialMode ?? loadMode();
  return {
    themeMode: mode,
    resolvedTheme: resolveTheme(mode),
    cycleTheme() {
      // Placeholder — overridden by zustand set()
    },
  };
}

/** Factory for testing — creates an isolated store instance */
export function createThemeStore(initialMode?: ThemeMode) {
  return createStore<ThemeState>()((set) => ({
    ...makeStore(initialMode),
    cycleTheme() {
      set((state) => {
        const idx = CYCLE.indexOf(state.themeMode);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        persistMode(next);
        return { themeMode: next, resolvedTheme: resolveTheme(next) };
      });
    },
  }));
}

/** Singleton store for app use */
export const useThemeStore = create<ThemeState>()((set) => ({
  ...makeStore(),
  cycleTheme() {
    set((state) => {
      const idx = CYCLE.indexOf(state.themeMode);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      persistMode(next);
      return { themeMode: next, resolvedTheme: resolveTheme(next) };
    });
  },
}));

/** Call getSystemTheme() and update resolvedTheme if mode is 'system' */
export function syncSystemTheme() {
  const { themeMode } = useThemeStore.getState();
  if (themeMode === 'system') {
    useThemeStore.setState({ resolvedTheme: getSystemTheme() });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/themes/__tests__/themeStore.test.ts`
Expected: ALL PASS.

- [ ] **Step 5: Commit**

```bash
git add src/themes/themeStore.ts src/themes/__tests__/themeStore.test.ts
git commit -m "feat(theme): create theme store with light/dark/system modes"
```

---

### Task 2: Add CSS custom properties with `[data-theme]` selectors

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace prefers-color-scheme with data-theme selectors**

In `src/index.css`, the current theme variables are defined in `:root` (light defaults) and overridden in `@media (prefers-color-scheme: dark)`. Replace this approach with `[data-theme]` attribute selectors.

Replace the entire `:root` block (lines 1-31) with:

```css
:root, [data-theme="light"] {
  --text: #6b6375;
  --text-h: #08060d;
  --bg: #fff;
  --border: #e5e4e7;
  --code-bg: #f4f3ec;
  --accent: #aa3bff;
  --accent-bg: rgba(170, 59, 255, 0.1);
  --accent-border: rgba(170, 59, 255, 0.5);
  --social-bg: rgba(244, 243, 236, 0.5);
  --shadow:
    rgba(0, 0, 0, 0.1) 0 10px 15px -3px, rgba(0, 0, 0, 0.05) 0 4px 6px -2px;

  --app-bg: #fff;
  --border-dark: #e5e4e7;
  --border-dim: #d9d9d9;
  --color-white: #1a1a1a;
  --color-muted: #999;
  --color-dim: #888;
  --drag-card-bg: #e8f0fe;

  --sans: system-ui, 'Segoe UI', Roboto, sans-serif;
  --heading: system-ui, 'Segoe UI', Roboto, sans-serif;
  --mono: ui-monospace, Consolas, monospace;

  font: 18px/145% var(--sans);
  letter-spacing: 0.18px;
  color-scheme: light dark;
  color: var(--text);
  background: var(--bg);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  @media (max-width: 1024px) {
    font-size: 16px;
  }
}
```

Replace the `@media (prefers-color-scheme: dark)` block (lines 33-51) with:

```css
[data-theme="dark"] {
  --text: #9ca3af;
  --text-h: #f3f4f6;
  --bg: #16171d;
  --border: #2e303a;
  --code-bg: #1f2028;
  --accent: #c084fc;
  --accent-bg: rgba(192, 132, 252, 0.15);
  --accent-border: rgba(192, 132, 252, 0.5);
  --social-bg: rgba(47, 48, 58, 0.5);
  --shadow:
    rgba(0, 0, 0, 0.4) 0 10px 15px -3px, rgba(0, 0, 0, 0.25) 0 4px 6px -2px;

  --app-bg: #0d0d0d;
  --border-dark: #222;
  --border-dim: #333;
  --color-white: #fff;
  --color-muted: #555;
  --color-dim: #666;
  --drag-card-bg: #1e2a3a;
}

[data-theme="dark"] #social .button-icon {
  filter: invert(1) brightness(2);
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(theme): replace prefers-color-scheme with data-theme selectors"
```

---

### Task 3: Migrate Less tokens to CSS custom properties

**Files:**
- Modify: `src/themes/mixin.module.less`

- [ ] **Step 1: Replace hardcoded theme-sensitive tokens with var() references**

In `src/themes/mixin.module.less`, replace the design tokens section (lines 2-11):

From:
```less
@app-bg:          #0d0d0d;
@border-dark:     #222;
@border-dim:      #333;
@color-blue:      #1890ff;
@color-yellow:    #faad14;
@color-green:     #52c41a;
@color-white:     #fff;
@color-muted:     #555;
@color-dim:       #666;
@drag-card-bg:    #1e2a3a;
```

To:
```less
@app-bg:          var(--app-bg);
@border-dark:     var(--border-dark);
@border-dim:      var(--border-dim);
@color-blue:      #1890ff;
@color-yellow:    #faad14;
@color-green:     #52c41a;
@color-white:     var(--color-white);
@color-muted:     var(--color-muted);
@color-dim:       var(--color-dim);
@drag-card-bg:    var(--drag-card-bg);
```

Theme-agnostic tokens (`@color-blue`, `@color-yellow`, `@color-green`) stay hardcoded.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds. All consumer `.module.less` files continue to work — they import `@token` which now resolves to `var(--token)`.

- [ ] **Step 3: Commit**

```bash
git add src/themes/mixin.module.less
git commit -m "feat(theme): migrate Less tokens to CSS custom properties"
```

---

### Task 4: Wire theme into App.tsx — button, ConfigProvider, useThemeSync

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add imports**

In `src/App.tsx`, add:

```tsx
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import { useThemeStore, syncSystemTheme } from '@/themes/themeStore';
```

- [ ] **Step 2: Add useThemeSync effect and store selectors**

Inside the `App` component, add after existing selectors:

```tsx
const themeMode = useThemeStore(s => s.themeMode);
const resolvedTheme = useThemeStore(s => s.resolvedTheme);
const cycleTheme = useThemeStore(s => s.cycleTheme);

useEffect(() => {
  document.documentElement.dataset.theme = resolvedTheme;
}, [resolvedTheme]);

useEffect(() => {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => syncSystemTheme();
  mql.addEventListener('change', handler);
  return () => mql.removeEventListener('change', handler);
}, []);
```

- [ ] **Step 3: Switch ConfigProvider algorithm**

Change:
```tsx
<ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
```
To:
```tsx
<ConfigProvider theme={{ algorithm: resolvedTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
```

- [ ] **Step 4: Add theme toggle button to toolbar**

Add before the Edit Mode button:

```tsx
<Tooltip title={themeMode === 'light' ? 'Light' : themeMode === 'dark' ? 'Dark' : 'System'}>
  <Button
    size="small"
    icon={themeMode === 'light' ? <SunOutlined /> : themeMode === 'dark' ? <MoonOutlined /> : <DesktopOutlined />}
    onClick={cycleTheme}
  />
</Tooltip>
```

- [ ] **Step 5: Verify build, lint, and tests**

Run: `pnpm build && pnpm lint && pnpm test`
Expected: All pass.

- [ ] **Step 6: Verify manually**

Run: `pnpm dev`
- Click theme button: cycles light → dark → system
- Light mode: white background, dark text, antd light components
- Dark mode: dark background, light text, antd dark components
- System mode: follows OS preference
- Theme persists after page reload
- All layout components (splitters, overlays, leaf nodes) use correct theme colors

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(theme): wire theme switcher button and ConfigProvider into App"
```
