# @anthill-layout/embed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone render-only package (`@anthill-layout/embed`) that lets clients embed published layouts on their websites via React component or `<script>` tag.

**Architecture:** Standalone `packages/embed` package with its own types, widget components, lightweight CSS-flex renderer, fetcher with caching, and theme system. Two Vite library builds — ESM (React peer dep) and IIFE (React bundled). No antd, no Zustand, no DnD. Main app stays untouched; shared extraction deferred to a future iteration.

**Tech Stack:** React 19, Vite 8 (library mode), Vitest, CSS custom properties (`--al-*` prefix)

**Spec:** `docs/superpowers/specs/2026-04-09-embed-package-design.md`

---

### Task 1: Package Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `packages/embed/package.json`
- Create: `packages/embed/tsconfig.json`
- Create: `packages/embed/vitest.config.ts`
- Create: `packages/embed/src/index.ts` (placeholder)

- [ ] **Step 1: Create pnpm workspace config**

```yaml
# pnpm-workspace.yaml (root)
packages:
  - 'packages/*'
```

- [ ] **Step 2: Create packages/embed/package.json**

```json
{
  "name": "@anthill-layout/embed",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "main": "dist/index.mjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "types": "./dist/index.d.ts"
    },
    "./embed": "./dist/embed.js"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "jsdom": "^29.0.2",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "typescript": "~6.0.2",
    "vite": "^8.0.7",
    "vitest": "^4.1.3"
  },
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Create packages/embed/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "verbatimModuleSyntax": true,
    "erasableSyntaxOnly": false,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create packages/embed/vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [],
  },
});
```

- [ ] **Step 5: Create placeholder entry**

```ts
// packages/embed/src/index.ts
export {};
```

- [ ] **Step 6: Install dependencies and verify**

Run: `cd packages/embed && pnpm install`
Expected: Dependencies installed, no errors

Run: `cd packages/embed && pnpm test`
Expected: "No test files found" (no tests yet, but vitest runs)

- [ ] **Step 7: Commit**

```bash
git add pnpm-workspace.yaml packages/embed/package.json packages/embed/tsconfig.json packages/embed/vitest.config.ts packages/embed/src/index.ts
git commit -m "feat(embed): scaffold @anthill-layout/embed package"
```

---

### Task 2: Layout & Widget Types

**Files:**
- Create: `packages/embed/src/types.ts`

These types mirror the main app's types but are self-contained — no imports from the main app.

- [ ] **Step 1: Create types.ts**

```ts
// packages/embed/src/types.ts

// ─── CSS helpers ──────────────────────────────────────────────────────────────

export type CssValue = string;

export type WidgetBounds = {
  marginTop?: CssValue;
  marginRight?: CssValue;
  marginBottom?: CssValue;
  marginLeft?: CssValue;
  align?:
    | 'top-left' | 'top-center' | 'top-right'
    | 'center-left' | 'center' | 'center-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';
};

// ─── Widget types ─────────────────────────────────────────────────────────────

export const EWidgetResource = {
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  IFRAME: 'iframe',
  COMPONENT: 'component',
  EMPTY: 'empty',
} as const;
export type EWidgetResource = (typeof EWidgetResource)[keyof typeof EWidgetResource];

export type WidgetContent = {
  value: string;
};

export type WidgetConfig = {
  isEditable: boolean;
  isClonable: boolean;
  css?: WidgetBounds;
};

export type WidgetRef = {
  widgetId: string;
  resource: string;
  content: WidgetContent;
  config: Record<string, unknown>;
  bounds?: WidgetBounds;
};

// ─── Layout tree ──────────────────────────────────────────────────────────────

export type LeafNode = {
  id: string;
  type: 'leaf';
  widget?: WidgetRef;
};

export type SplitterNode = {
  id: string;
  type: 'splitter';
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  children: LayoutNode[];
};

export type SectionHeight =
  | { type: 'auto' }
  | { type: 'fixed'; value: string }
  | { type: 'min'; value: string };

export type SectionNode = {
  id: string;
  type: 'section';
  height: SectionHeight;
  child: LayoutNode;
  overlap?: string;
  zIndex?: number;
};

export type ScrollRoot = {
  id: string;
  type: 'scroll';
  sections: SectionNode[];
};

export type LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot;

// ─── Theme ────────────────────────────────────────────────────────────────────

export type WidgetLayoutTheme = {
  colorPrimary?: string;
  colorBg?: string;
  colorText?: string;
  colorBorder?: string;
  fontFamily?: string;
  fontSize?: number;
  borderRadius?: number;
  spacing?: number;
};

// ─── Widget definition (render-only, no editor/icon) ──────────────────────────

export type WidgetComponentProps = {
  content: WidgetContent;
  config: WidgetConfig;
};

export type WidgetDefinition = {
  resource: EWidgetResource;
  label: string;
  component: React.ComponentType<WidgetComponentProps>;
};
```

- [ ] **Step 2: Verify types compile**

Run: `cd packages/embed && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add packages/embed/src/types.ts
git commit -m "feat(embed): add layout, widget, and theme types"
```

---

### Task 3: Widget Registry & Built-in Widgets

**Files:**
- Create: `packages/embed/src/widgets/registry.ts`
- Create: `packages/embed/src/widgets/YouTubeWidget.tsx`
- Create: `packages/embed/src/widgets/ImageWidget.tsx`
- Create: `packages/embed/src/widgets/EmptyWidget.tsx`
- Create: `packages/embed/src/widgets/init.ts`
- Create: `packages/embed/src/widgets/__tests__/registry.test.ts`

- [ ] **Step 1: Write registry test**

```ts
// packages/embed/src/widgets/__tests__/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { registerWidget, getWidgetDef, getAllWidgetDefs, clearRegistry } from '../registry';
import type { WidgetDefinition } from '../../types';

const stub: WidgetDefinition = {
  resource: 'youtube',
  label: 'YouTube',
  component: () => null,
};

describe('widget registry', () => {
  beforeEach(() => clearRegistry());

  it('registers and retrieves a widget', () => {
    registerWidget(stub);
    expect(getWidgetDef('youtube')).toBe(stub);
  });

  it('returns undefined for unregistered resource', () => {
    expect(getWidgetDef('image')).toBeUndefined();
  });

  it('lists all registered widgets', () => {
    registerWidget(stub);
    registerWidget({ ...stub, resource: 'image', label: 'Image' });
    expect(getAllWidgetDefs()).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

Run: `cd packages/embed && pnpm test`
Expected: FAIL — module not found

- [ ] **Step 3: Implement registry**

```ts
// packages/embed/src/widgets/registry.ts
import type { EWidgetResource, WidgetDefinition } from '../types';

const registry = new Map<EWidgetResource, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition): void {
  registry.set(def.resource, def);
}

export function getWidgetDef(resource: EWidgetResource): WidgetDefinition | undefined {
  return registry.get(resource);
}

export function getAllWidgetDefs(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function clearRegistry(): void {
  registry.clear();
}
```

- [ ] **Step 4: Run test — verify it passes**

Run: `cd packages/embed && pnpm test`
Expected: 3 tests PASS

- [ ] **Step 5: Create widget components**

```tsx
// packages/embed/src/widgets/YouTubeWidget.tsx
import type { WidgetComponentProps } from '../types';

function toEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

export function YouTubeWidget({ content }: WidgetComponentProps) {
  const embedUrl = toEmbedUrl(content.value);

  if (!embedUrl) {
    return <div className="al-widget-empty">No YouTube URL</div>;
  }

  return (
    <iframe
      src={embedUrl}
      className="al-widget-iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube video"
    />
  );
}
```

```tsx
// packages/embed/src/widgets/ImageWidget.tsx
import type { WidgetComponentProps } from '../types';

export function ImageWidget({ content }: WidgetComponentProps) {
  if (!content.value) {
    return <div className="al-widget-empty">No image URL</div>;
  }

  return (
    <img
      src={content.value}
      alt="Widget"
      className="al-widget-image"
    />
  );
}
```

```tsx
// packages/embed/src/widgets/EmptyWidget.tsx
import type { WidgetComponentProps } from '../types';

export function EmptyWidget({ content }: WidgetComponentProps) {
  return (
    <div className="al-widget-empty">
      {content.value || 'Empty'}
    </div>
  );
}
```

- [ ] **Step 6: Create init.ts to register all widgets**

```ts
// packages/embed/src/widgets/init.ts
import { registerWidget } from './registry';
import { YouTubeWidget } from './YouTubeWidget';
import { ImageWidget } from './ImageWidget';
import { EmptyWidget } from './EmptyWidget';

registerWidget({ resource: 'youtube', label: 'YouTube', component: YouTubeWidget });
registerWidget({ resource: 'image', label: 'Image', component: ImageWidget });
registerWidget({ resource: 'empty', label: 'Empty', component: EmptyWidget });
```

- [ ] **Step 7: Verify types compile**

Run: `cd packages/embed && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add packages/embed/src/widgets/
git commit -m "feat(embed): add widget registry and built-in widgets"
```

---

### Task 4: Fetcher (TDD)

**Files:**
- Create: `packages/embed/src/__tests__/fetcher.test.ts`
- Create: `packages/embed/src/fetcher.ts`

- [ ] **Step 1: Write fetcher tests**

```ts
// packages/embed/src/__tests__/fetcher.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLayout, clearCache } from '../fetcher';
import type { LayoutNode } from '../types';

const mockLeaf: LayoutNode = { id: 'leaf-1', type: 'leaf' };

describe('fetchLayout', () => {
  beforeEach(() => {
    clearCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns inline layout directly', async () => {
    const result = await fetchLayout({ layout: mockLeaf });
    expect(result).toBe(mockLeaf);
  });

  it('fetches layout from URL', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const result = await fetchLayout({ layoutUrl: 'https://example.com/layout.json' });
    expect(result).toEqual(mockLeaf);
    expect(fetch).toHaveBeenCalledWith('https://example.com/layout.json');
  });

  it('fetches layout by ID from API', async () => {
    const apiResponse = [{ data: mockLeaf }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(apiResponse), { status: 200 }),
    );

    const result = await fetchLayout({
      layoutId: 'abc-123',
      apiBase: 'https://api.test.com',
      apiKey: 'test-key',
    });

    expect(result).toEqual(mockLeaf);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.test.com/rest/v1/layouts?id=eq.abc-123&status=eq.published&order=version.desc&limit=1',
      {
        headers: {
          apikey: 'test-key',
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('prioritizes layout > layoutUrl > layoutId', async () => {
    const result = await fetchLayout({
      layout: mockLeaf,
      layoutUrl: 'https://example.com/layout.json',
      layoutId: 'abc-123',
    });
    expect(result).toBe(mockLeaf);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('caches results by key', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const r1 = await fetchLayout({ layoutUrl: 'https://example.com/a.json' });
    const r2 = await fetchLayout({ layoutUrl: 'https://example.com/a.json' });
    expect(r1).toEqual(r2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('deduplicates concurrent requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockLeaf), { status: 200 }),
    );

    const [r1, r2] = await Promise.all([
      fetchLayout({ layoutUrl: 'https://example.com/b.json' }),
      fetchLayout({ layoutUrl: 'https://example.com/b.json' }),
    ]);
    expect(r1).toEqual(r2);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );

    await expect(
      fetchLayout({ layoutUrl: 'https://example.com/missing.json' }),
    ).rejects.toThrow();
  });

  it('throws when no source provided', async () => {
    await expect(fetchLayout({})).rejects.toThrow(
      'No layout source provided',
    );
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/embed && pnpm test`
Expected: FAIL — module `../fetcher` not found

- [ ] **Step 3: Implement fetcher**

```ts
// packages/embed/src/fetcher.ts
import type { LayoutNode } from './types';

export type FetchOptions = {
  layout?: LayoutNode;
  layoutUrl?: string;
  layoutId?: string;
  apiBase?: string;
  apiKey?: string;
};

type CacheEntry = { data: LayoutNode; timestamp: number };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<LayoutNode>>();

export function clearCache(): void {
  cache.clear();
  inflight.clear();
}

function getCached(key: string): LayoutNode | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return undefined;
  }
  return entry.data;
}

function setCache(key: string, data: LayoutNode): void {
  cache.set(key, { data, timestamp: Date.now() });
}

async function fetchFromUrl(url: string): Promise<LayoutNode> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch layout: ${res.status} ${res.statusText}`);
  return res.json() as Promise<LayoutNode>;
}

async function fetchFromApi(
  layoutId: string,
  apiBase: string,
  apiKey: string,
): Promise<LayoutNode> {
  const url = `${apiBase}/rest/v1/layouts?id=eq.${layoutId}&status=eq.published&order=version.desc&limit=1`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch layout: ${res.status} ${res.statusText}`);
  const rows = (await res.json()) as Array<{ data: LayoutNode }>;
  if (rows.length === 0) throw new Error(`Layout not found: ${layoutId}`);
  return rows[0].data;
}

async function doFetch(opts: FetchOptions): Promise<LayoutNode> {
  if (opts.layout) return opts.layout;

  if (opts.layoutUrl) return fetchFromUrl(opts.layoutUrl);

  if (opts.layoutId) {
    if (!opts.apiBase) throw new Error('apiBase is required when using layoutId');
    if (!opts.apiKey) throw new Error('apiKey is required when using layoutId');
    return fetchFromApi(opts.layoutId, opts.apiBase, opts.apiKey);
  }

  throw new Error('No layout source provided');
}

export async function fetchLayout(opts: FetchOptions): Promise<LayoutNode> {
  // Inline layout — no caching needed
  if (opts.layout) return opts.layout;

  const key = opts.layoutUrl ?? `api:${opts.layoutId}`;

  // Check cache
  const cached = getCached(key);
  if (cached) return cached;

  // Deduplicate concurrent requests
  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = doFetch(opts).then((data) => {
    setCache(key, data);
    inflight.delete(key);
    return data;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/embed && pnpm test`
Expected: 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/embed/src/fetcher.ts packages/embed/src/__tests__/fetcher.test.ts
git commit -m "feat(embed): add layout fetcher with caching and deduplication"
```

---

### Task 5: Theme Mapper (TDD)

**Files:**
- Create: `packages/embed/src/__tests__/theme.test.ts`
- Create: `packages/embed/src/theme.ts`

- [ ] **Step 1: Write theme tests**

```ts
// packages/embed/src/__tests__/theme.test.ts
import { describe, it, expect } from 'vitest';
import { themeToStyleVars } from '../theme';

describe('themeToStyleVars', () => {
  it('returns empty object for undefined theme', () => {
    expect(themeToStyleVars(undefined)).toEqual({});
  });

  it('maps string properties to CSS variables', () => {
    const result = themeToStyleVars({
      colorPrimary: '#ff0000',
      fontFamily: 'Inter',
    });
    expect(result).toEqual({
      '--al-color-primary': '#ff0000',
      '--al-font-family': 'Inter',
    });
  });

  it('maps number properties with px suffix', () => {
    const result = themeToStyleVars({
      fontSize: 16,
      borderRadius: 8,
      spacing: 4,
    });
    expect(result).toEqual({
      '--al-font-size': '16px',
      '--al-border-radius': '8px',
      '--al-spacing': '4px',
    });
  });

  it('skips undefined values', () => {
    const result = themeToStyleVars({
      colorPrimary: '#000',
      colorBg: undefined,
    });
    expect(result).toEqual({
      '--al-color-primary': '#000',
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/embed && pnpm test -- src/__tests__/theme.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement theme mapper**

```ts
// packages/embed/src/theme.ts
import type { WidgetLayoutTheme } from './types';

const THEME_MAP: Record<keyof WidgetLayoutTheme, { var: string; unit?: string }> = {
  colorPrimary: { var: '--al-color-primary' },
  colorBg: { var: '--al-color-bg' },
  colorText: { var: '--al-color-text' },
  colorBorder: { var: '--al-color-border' },
  fontFamily: { var: '--al-font-family' },
  fontSize: { var: '--al-font-size', unit: 'px' },
  borderRadius: { var: '--al-border-radius', unit: 'px' },
  spacing: { var: '--al-spacing', unit: 'px' },
};

export function themeToStyleVars(
  theme: WidgetLayoutTheme | undefined,
): Record<string, string> {
  if (!theme) return {};

  const vars: Record<string, string> = {};

  for (const [key, mapping] of Object.entries(THEME_MAP)) {
    const value = theme[key as keyof WidgetLayoutTheme];
    if (value === undefined) continue;
    vars[mapping.var] = mapping.unit ? `${value}${mapping.unit}` : String(value);
  }

  return vars;
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/embed && pnpm test -- src/__tests__/theme.test.ts`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/embed/src/theme.ts packages/embed/src/__tests__/theme.test.ts
git commit -m "feat(embed): add theme-to-CSS-variables mapper"
```

---

### Task 6: Embed Renderer Components (TDD)

**Files:**
- Create: `packages/embed/src/renderer/EmbedWidgetRenderer.tsx`
- Create: `packages/embed/src/renderer/EmbedLeaf.tsx`
- Create: `packages/embed/src/renderer/EmbedSplitter.tsx`
- Create: `packages/embed/src/renderer/EmbedScrollLayout.tsx`
- Create: `packages/embed/src/renderer/EmbedLayoutRenderer.tsx`
- Create: `packages/embed/src/renderer/__tests__/EmbedLayoutRenderer.test.tsx`

- [ ] **Step 1: Write renderer tests**

```tsx
// packages/embed/src/renderer/__tests__/EmbedLayoutRenderer.test.tsx
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmbedLayoutRenderer } from '../EmbedLayoutRenderer';
import type { LeafNode, SplitterNode, ScrollRoot, LayoutNode } from '../../types';
import '../../widgets/init';

const leaf: LeafNode = {
  id: 'l1',
  type: 'leaf',
  widget: {
    widgetId: 'w1',
    resource: 'empty',
    content: { value: 'Hello' },
    config: {},
  },
};

const leafNoWidget: LeafNode = { id: 'l2', type: 'leaf' };

const splitter: SplitterNode = {
  id: 's1',
  type: 'splitter',
  direction: 'horizontal',
  sizes: [60, 40],
  children: [
    leaf,
    { id: 'l3', type: 'leaf', widget: { widgetId: 'w2', resource: 'empty', content: { value: 'World' }, config: {} } },
  ],
};

const scroll: ScrollRoot = {
  id: 'sr1',
  type: 'scroll',
  sections: [
    {
      id: 'sec1',
      type: 'section',
      height: { type: 'fixed', value: '300px' },
      child: leaf,
    },
    {
      id: 'sec2',
      type: 'section',
      height: { type: 'auto' },
      child: leafNoWidget,
      overlap: '-20px',
      zIndex: 2,
    },
  ],
};

describe('EmbedLayoutRenderer', () => {
  it('renders a leaf with widget', () => {
    const { container } = render(<EmbedLayoutRenderer root={leaf} />);
    expect(container.querySelector('.al-leaf')).not.toBeNull();
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('renders an empty leaf', () => {
    const { container } = render(<EmbedLayoutRenderer root={leafNoWidget} />);
    expect(container.querySelector('.al-leaf')).not.toBeNull();
  });

  it('renders a splitter with correct flex styles', () => {
    const { container } = render(<EmbedLayoutRenderer root={splitter} />);
    const splitterEl = container.querySelector('.al-splitter');
    expect(splitterEl).not.toBeNull();
    expect(splitterEl!.classList.contains('al-splitter--horizontal')).toBe(true);

    const panels = container.querySelectorAll('.al-panel');
    expect(panels).toHaveLength(2);
    expect((panels[0] as HTMLElement).style.flexBasis).toBe('60%');
    expect((panels[1] as HTMLElement).style.flexBasis).toBe('40%');
  });

  it('renders a vertical splitter', () => {
    const vertical: SplitterNode = { ...splitter, direction: 'vertical' };
    const { container } = render(<EmbedLayoutRenderer root={vertical} />);
    const splitterEl = container.querySelector('.al-splitter');
    expect(splitterEl!.classList.contains('al-splitter--vertical')).toBe(true);
  });

  it('renders scroll layout with sections', () => {
    const { container } = render(<EmbedLayoutRenderer root={scroll} />);
    const scrollEl = container.querySelector('.al-scroll');
    expect(scrollEl).not.toBeNull();

    const sections = container.querySelectorAll('.al-section');
    expect(sections).toHaveLength(2);
    expect((sections[0] as HTMLElement).style.height).toBe('300px');
    expect((sections[1] as HTMLElement).style.marginTop).toBe('-20px');
    expect((sections[1] as HTMLElement).style.zIndex).toBe('2');
  });

  it('renders nested splitters', () => {
    const nested: SplitterNode = {
      id: 'outer',
      type: 'splitter',
      direction: 'horizontal',
      sizes: [50, 50],
      children: [
        leaf,
        {
          id: 'inner',
          type: 'splitter',
          direction: 'vertical',
          sizes: [30, 70],
          children: [leaf, leafNoWidget],
        },
      ],
    };
    const { container } = render(<EmbedLayoutRenderer root={nested} />);
    const splitters = container.querySelectorAll('.al-splitter');
    expect(splitters).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/embed && pnpm test -- src/renderer/__tests__/`
Expected: FAIL — modules not found

- [ ] **Step 3: Implement EmbedWidgetRenderer**

```tsx
// packages/embed/src/renderer/EmbedWidgetRenderer.tsx
import type { WidgetRef } from '../types';
import type { EWidgetResource } from '../types';
import { getWidgetDef } from '../widgets/registry';

type Props = { widget: WidgetRef };

const ALIGN_STYLES: Record<string, React.CSSProperties> = {
  'top-left': { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' },
  'top-center': { display: 'flex', alignItems: 'flex-start', justifyContent: 'center' },
  'top-right': { display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' },
  'center-left': { display: 'flex', alignItems: 'center', justifyContent: 'flex-start' },
  'center': { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  'center-right': { display: 'flex', alignItems: 'center', justifyContent: 'flex-end' },
  'bottom-left': { display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' },
  'bottom-center': { display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  'bottom-right': { display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' },
};

export function EmbedWidgetRenderer({ widget }: Props) {
  const def = getWidgetDef(widget.resource as EWidgetResource);
  const { bounds } = widget;

  const alignStyle = ALIGN_STYLES[bounds?.align ?? 'top-left'] ?? ALIGN_STYLES['top-left'];

  const mt = bounds?.marginTop;
  const mr = bounds?.marginRight;
  const mb = bounds?.marginBottom;
  const ml = bounds?.marginLeft;
  const hasMargins = mt || mr || mb || ml;

  const style: React.CSSProperties = {
    ...alignStyle,
    width: '100%',
    height: '100%',
    position: hasMargins ? 'absolute' : 'relative',
    ...(hasMargins ? { inset: `${mt ?? 0} ${mr ?? 0} ${mb ?? 0} ${ml ?? 0}` } : {}),
  };

  if (!def) {
    return (
      <div className="al-widget" style={style}>
        <div className="al-widget-empty">{widget.widgetId}</div>
      </div>
    );
  }

  const Comp = def.component;

  return (
    <div className="al-widget" style={style}>
      <Comp
        content={widget.content ?? { value: '' }}
        config={{ isEditable: false, isClonable: true, ...widget.config }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Implement EmbedLeaf**

```tsx
// packages/embed/src/renderer/EmbedLeaf.tsx
import type { LeafNode } from '../types';
import { EmbedWidgetRenderer } from './EmbedWidgetRenderer';

type Props = { node: LeafNode };

export function EmbedLeaf({ node }: Props) {
  return (
    <div className="al-leaf">
      {node.widget ? (
        <EmbedWidgetRenderer widget={node.widget} />
      ) : (
        <div className="al-widget-empty" />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Implement EmbedSplitter**

```tsx
// packages/embed/src/renderer/EmbedSplitter.tsx
import type { SplitterNode } from '../types';
import { renderNode } from './EmbedLayoutRenderer';

type Props = { node: SplitterNode };

export function EmbedSplitter({ node }: Props) {
  const direction = node.direction === 'horizontal' ? 'row' : 'column';

  return (
    <div
      className={`al-splitter al-splitter--${node.direction}`}
      style={{ display: 'flex', flexDirection: direction, width: '100%', height: '100%' }}
    >
      {node.children.map((child, i) => (
        <div
          key={child.id}
          className="al-panel"
          style={{ flexBasis: `${node.sizes[i]}%`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          {renderNode(child)}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Implement EmbedScrollLayout**

```tsx
// packages/embed/src/renderer/EmbedScrollLayout.tsx
import type { ScrollRoot, SectionNode } from '../types';
import { renderNode } from './EmbedLayoutRenderer';

function getSectionStyle(section: SectionNode): React.CSSProperties {
  const style: React.CSSProperties = { width: '100%', position: 'relative' };
  switch (section.height.type) {
    case 'fixed': style.height = section.height.value; break;
    case 'min': style.minHeight = section.height.value; break;
    default: break;
  }
  if (section.overlap) style.marginTop = section.overlap;
  if (section.zIndex) style.zIndex = section.zIndex;
  return style;
}

type Props = { root: ScrollRoot };

export function EmbedScrollLayout({ root }: Props) {
  return (
    <div className="al-scroll">
      {root.sections.map((section) => (
        <div key={section.id} className="al-section" style={getSectionStyle(section)}>
          {renderNode(section.child)}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Implement EmbedLayoutRenderer**

```tsx
// packages/embed/src/renderer/EmbedLayoutRenderer.tsx
import type { LayoutNode, ScrollRoot } from '../types';
import { EmbedSplitter } from './EmbedSplitter';
import { EmbedLeaf } from './EmbedLeaf';
import { EmbedScrollLayout } from './EmbedScrollLayout';

export function renderNode(node: LayoutNode): React.ReactNode {
  switch (node.type) {
    case 'splitter':
      return <EmbedSplitter key={node.id} node={node} />;
    case 'leaf':
      return <EmbedLeaf key={node.id} node={node} />;
    case 'scroll':
      return <EmbedScrollLayout key={node.id} root={node} />;
    case 'section':
      return renderNode(node.child);
  }
}

type Props = { root: LayoutNode };

export function EmbedLayoutRenderer({ root }: Props) {
  return <>{renderNode(root)}</>;
}
```

- [ ] **Step 8: Run tests — verify they pass**

Run: `cd packages/embed && pnpm test -- src/renderer/__tests__/`
Expected: 6 tests PASS

- [ ] **Step 9: Commit**

```bash
git add packages/embed/src/renderer/
git commit -m "feat(embed): add lightweight read-only layout renderer"
```

---

### Task 7: CSS Styles

**Files:**
- Create: `packages/embed/src/styles.css`

- [ ] **Step 1: Create embed styles**

```css
/* packages/embed/src/styles.css */

/* ─── Theme defaults ─────────────────────────────────────────────────────── */

.al-root {
  --al-color-primary: #1677ff;
  --al-color-bg: #ffffff;
  --al-color-text: #1f1f1f;
  --al-color-border: #e8e8e8;
  --al-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --al-font-size: 14px;
  --al-border-radius: 6px;
  --al-spacing: 0px;

  font-family: var(--al-font-family);
  font-size: var(--al-font-size);
  color: var(--al-color-text);
  background: var(--al-color-bg);
  width: 100%;
  height: 100%;
  position: relative;
  box-sizing: border-box;
}

.al-root *,
.al-root *::before,
.al-root *::after {
  box-sizing: border-box;
}

/* ─── Full-page mode ─────────────────────────────────────────────────────── */

.al-root--full-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
}

/* ─── Splitter ───────────────────────────────────────────────────────────── */

.al-splitter {
  width: 100%;
  height: 100%;
  gap: var(--al-spacing);
}

/* ─── Panel ──────────────────────────────────────────────────────────────── */

.al-panel {
  position: relative;
}

/* ─── Leaf ───────────────────────────────────────────────────────────────── */

.al-leaf {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: var(--al-border-radius);
}

/* ─── Scroll layout ──────────────────────────────────────────────────────── */

.al-scroll {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.al-section {
  position: relative;
}

/* ─── Widget helpers ─────────────────────────────────────────────────────── */

.al-widget {
  width: 100%;
  height: 100%;
}

.al-widget-empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
}

.al-widget-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.al-widget-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ─── Loading / Error states ─────────────────────────────────────────────── */

.al-loading {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.al-skeleton {
  width: 60%;
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: al-shimmer 1.5s infinite;
  border-radius: var(--al-border-radius);
}

@keyframes al-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.al-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #999;
  font-size: 14px;
}

.al-error-retry {
  padding: 6px 16px;
  border: 1px solid var(--al-color-border);
  border-radius: var(--al-border-radius);
  background: var(--al-color-bg);
  color: var(--al-color-text);
  cursor: pointer;
  font-size: 13px;
}

.al-error-retry:hover {
  border-color: var(--al-color-primary);
  color: var(--al-color-primary);
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/embed/src/styles.css
git commit -m "feat(embed): add al-* prefixed CSS with theme variables"
```

---

### Task 8: WidgetLayout Component (TDD)

**Files:**
- Create: `packages/embed/src/__tests__/WidgetLayout.test.tsx`
- Create: `packages/embed/src/WidgetLayout.tsx`
- Modify: `packages/embed/src/index.ts`

- [ ] **Step 1: Write WidgetLayout tests**

```tsx
// packages/embed/src/__tests__/WidgetLayout.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { WidgetLayout } from '../WidgetLayout';
import type { LayoutNode } from '../types';
import '../widgets/init';

const mockLeaf: LayoutNode = {
  id: 'l1',
  type: 'leaf',
  widget: {
    widgetId: 'w1',
    resource: 'empty',
    content: { value: 'Test Widget' },
    config: {},
  },
};

describe('WidgetLayout', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders inline layout immediately', async () => {
    render(<WidgetLayout layout={mockLeaf} />);
    await waitFor(() => {
      expect(screen.getByText('Test Widget')).toBeDefined();
    });
  });

  it('applies al-root class', () => {
    const { container } = render(<WidgetLayout layout={mockLeaf} />);
    expect(container.querySelector('.al-root')).not.toBeNull();
  });

  it('applies full-page class when fullPage is true', () => {
    const { container } = render(<WidgetLayout layout={mockLeaf} fullPage />);
    expect(container.querySelector('.al-root--full-page')).not.toBeNull();
  });

  it('applies theme as CSS variables', () => {
    const { container } = render(
      <WidgetLayout layout={mockLeaf} theme={{ colorPrimary: '#ff0000' }} />,
    );
    const root = container.querySelector('.al-root') as HTMLElement;
    expect(root.style.getPropertyValue('--al-color-primary')).toBe('#ff0000');
  });

  it('shows loading state when fetching', () => {
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {})); // never resolves
    const { container } = render(<WidgetLayout layoutUrl="https://example.com/a.json" />);
    expect(container.querySelector('.al-loading')).not.toBeNull();
  });

  it('shows error state on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );
    render(<WidgetLayout layoutUrl="https://example.com/missing.json" />);
    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeDefined();
    });
  });

  it('calls onLoad after successful render', async () => {
    const onLoad = vi.fn();
    render(<WidgetLayout layout={mockLeaf} onLoad={onLoad} />);
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('calls onError on fetch failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Not Found', { status: 404 }),
    );
    const onError = vi.fn();
    render(<WidgetLayout layoutUrl="https://example.com/x.json" onError={onError} />);
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/embed && pnpm test -- src/__tests__/WidgetLayout.test.tsx`
Expected: FAIL — module not found

- [ ] **Step 3: Implement WidgetLayout**

```tsx
// packages/embed/src/WidgetLayout.tsx
import { useState, useEffect, useCallback } from 'react';
import type { LayoutNode, WidgetLayoutTheme } from './types';
import { fetchLayout, clearCache } from './fetcher';
import { themeToStyleVars } from './theme';
import { EmbedLayoutRenderer } from './renderer/EmbedLayoutRenderer';
import './styles.css';

export type WidgetLayoutProps = {
  layoutId?: string;
  layout?: LayoutNode;
  layoutUrl?: string;
  fullPage?: boolean;
  theme?: WidgetLayoutTheme;
  apiBase?: string;
  apiKey?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
};

type State =
  | { status: 'loading' }
  | { status: 'ready'; data: LayoutNode }
  | { status: 'error'; error: Error };

export function WidgetLayout({
  layoutId,
  layout,
  layoutUrl,
  fullPage,
  theme,
  apiBase,
  apiKey,
  onLoad,
  onError,
}: WidgetLayoutProps) {
  const [state, setState] = useState<State>(
    layout ? { status: 'ready', data: layout } : { status: 'loading' },
  );

  const load = useCallback(() => {
    setState({ status: 'loading' });
    fetchLayout({ layout, layoutUrl, layoutId, apiBase, apiKey })
      .then((data) => {
        setState({ status: 'ready', data });
        onLoad?.();
      })
      .catch((error: Error) => {
        setState({ status: 'error', error });
        onError?.(error);
      });
  }, [layout, layoutUrl, layoutId, apiBase, apiKey, onLoad, onError]);

  useEffect(() => {
    if (layout) {
      setState({ status: 'ready', data: layout });
      onLoad?.();
      return;
    }
    load();
  }, [layout, layoutUrl, layoutId, apiBase, apiKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const themeVars = themeToStyleVars(theme);
  const className = ['al-root', fullPage && 'al-root--full-page'].filter(Boolean).join(' ');

  return (
    <div className={className} style={themeVars}>
      {state.status === 'loading' && (
        <div className="al-loading">
          <div className="al-skeleton" />
        </div>
      )}
      {state.status === 'error' && (
        <div className="al-error">
          <span>Failed to load layout</span>
          <button className="al-error-retry" onClick={load}>
            Retry
          </button>
        </div>
      )}
      {state.status === 'ready' && <EmbedLayoutRenderer root={state.data} />}
    </div>
  );
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/embed && pnpm test -- src/__tests__/WidgetLayout.test.tsx`
Expected: 8 tests PASS

- [ ] **Step 5: Update index.ts exports**

```ts
// packages/embed/src/index.ts
import './widgets/init';

export { WidgetLayout } from './WidgetLayout';
export type { WidgetLayoutProps } from './WidgetLayout';
export type { WidgetLayoutTheme, LayoutNode } from './types';
```

- [ ] **Step 6: Commit**

```bash
git add packages/embed/src/WidgetLayout.tsx packages/embed/src/__tests__/WidgetLayout.test.tsx packages/embed/src/index.ts
git commit -m "feat(embed): add WidgetLayout React component with fetch/theme/states"
```

---

### Task 9: Auto-Mount & Embed Entry

**Files:**
- Create: `packages/embed/src/mount.ts`
- Create: `packages/embed/src/embed.ts`
- Create: `packages/embed/src/__tests__/mount.test.ts`

- [ ] **Step 1: Write mount tests**

```ts
// packages/embed/src/__tests__/mount.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('mount', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('mounts into element with data-widget-layout', async () => {
    document.body.innerHTML = '<div data-widget-layout="test-id"></div>';

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const el = document.querySelector('[data-widget-layout]');
    // React root is created — element has children
    expect(el!.children.length).toBeGreaterThan(0);
  });

  it('mounts into element with data-widget-layout-url', async () => {
    document.body.innerHTML = '<div data-widget-layout-url="https://example.com/l.json"></div>';

    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const el = document.querySelector('[data-widget-layout-url]');
    expect(el!.children.length).toBeGreaterThan(0);
  });

  it('parses data-theme JSON', async () => {
    document.body.innerHTML = `<div data-widget-layout="x" data-theme='{"colorPrimary":"red"}'></div>`;

    const { scanAndMount } = await import('../mount');
    scanAndMount();

    const root = document.querySelector('.al-root') as HTMLElement;
    expect(root).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `cd packages/embed && pnpm test -- src/__tests__/mount.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement mount.ts**

```ts
// packages/embed/src/mount.ts
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { WidgetLayout } from './WidgetLayout';
import type { WidgetLayoutProps } from './WidgetLayout';
import type { WidgetLayoutTheme } from './types';
import './widgets/init';

function parseTheme(attr: string | null): WidgetLayoutTheme | undefined {
  if (!attr) return undefined;
  try {
    return JSON.parse(attr) as WidgetLayoutTheme;
  } catch {
    console.warn('[anthill-layout] Invalid data-theme JSON:', attr);
    return undefined;
  }
}

function propsFromElement(el: Element): WidgetLayoutProps {
  const layoutId = el.getAttribute('data-widget-layout') ?? undefined;
  const layoutUrl = el.getAttribute('data-widget-layout-url') ?? undefined;
  const fullPage = el.getAttribute('data-full-page') === 'true';
  const theme = parseTheme(el.getAttribute('data-theme'));
  const apiBase = el.getAttribute('data-api-base') ?? undefined;
  const apiKey = el.getAttribute('data-api-key') ?? undefined;

  return { layoutId, layoutUrl, fullPage, theme, apiBase, apiKey };
}

export function mount(el: Element, props: WidgetLayoutProps): void {
  const root = createRoot(el);
  root.render(createElement(WidgetLayout, props));
}

export function scanAndMount(): void {
  const elements = document.querySelectorAll(
    '[data-widget-layout], [data-widget-layout-url]',
  );
  elements.forEach((el) => {
    mount(el, propsFromElement(el));
  });
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `cd packages/embed && pnpm test -- src/__tests__/mount.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Create embed.ts (IIFE entry)**

```ts
// packages/embed/src/embed.ts
import { mount, scanAndMount } from './mount';

// Expose global API
(window as Record<string, unknown>).AntHillLayout = { mount };

// Auto-mount on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scanAndMount);
} else {
  scanAndMount();
}
```

- [ ] **Step 6: Commit**

```bash
git add packages/embed/src/mount.ts packages/embed/src/embed.ts packages/embed/src/__tests__/mount.test.ts
git commit -m "feat(embed): add auto-mount and embed entry for script tag"
```

---

### Task 10: Vite Library Build Config

**Files:**
- Create: `packages/embed/vite.config.ts`
- Modify: `packages/embed/vitest.config.ts` (remove plugin duplication)

- [ ] **Step 1: Create Vite build config with two outputs**

```ts
// packages/embed/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        embed: resolve(__dirname, 'src/embed.ts'),
      },
      formats: ['es'],
      fileName: (_, entryName) => {
        if (entryName === 'embed') return 'embed.js';
        return 'index.mjs';
      },
    },
    rollupOptions: {
      external: (id, importer) => {
        // For embed entry: bundle everything (including React)
        if (importer && resolve(importer).includes('embed.ts')) return false;
        // For index entry: externalize React
        return ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'].includes(id);
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
  },
});
```

Note: The dual external logic above does not work with a single Vite build since `rollupOptions.external` cannot distinguish entry points during a combined build. We need two separate builds instead:

```ts
// packages/embed/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// ESM build config (npm) — React external
const esmConfig = defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.mjs',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
    outDir: 'dist',
  },
});

export default esmConfig;
```

```ts
// packages/embed/vite.embed.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// IIFE build config (script tag) — React bundled
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/embed.ts'),
      formats: ['iife'],
      name: 'AntHillLayout',
      fileName: () => 'embed.js',
    },
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: false,
    outDir: 'dist',
  },
});
```

- [ ] **Step 2: Update package.json build script**

Update `packages/embed/package.json` scripts:

```json
{
  "scripts": {
    "build": "vite build && vite build --config vite.embed.config.ts",
    "build:esm": "vite build",
    "build:iife": "vite build --config vite.embed.config.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Run ESM build**

Run: `cd packages/embed && pnpm build:esm`
Expected: `dist/index.mjs` created, `dist/style.css` created. React is NOT in the bundle.

- [ ] **Step 4: Run IIFE build**

Run: `cd packages/embed && pnpm build:iife`
Expected: `dist/embed.js` created (includes React). Check: `ls -lh packages/embed/dist/`

- [ ] **Step 5: Run full build**

Run: `cd packages/embed && pnpm build`
Expected: Both `dist/index.mjs` and `dist/embed.js` exist

- [ ] **Step 6: Verify bundle contents**

Run: `grep -c "createElement" packages/embed/dist/index.mjs` — should be 0 or very few (React externalized)
Run: `grep -c "createElement" packages/embed/dist/embed.js` — should be many (React bundled)

- [ ] **Step 7: Commit**

```bash
git add packages/embed/vite.config.ts packages/embed/vite.embed.config.ts packages/embed/package.json
git commit -m "feat(embed): add Vite library builds (ESM + IIFE)"
```

---

### Task 11: RLS Policy for Anon Access

**Files:**
- Create: `supabase/migrations/XXXXXXXX_published_layouts_anon_read.sql`

Use the next sequential migration number from your existing migrations directory.

- [ ] **Step 1: Create migration**

```sql
-- supabase/migrations/XXXXXXXX_published_layouts_anon_read.sql

-- Allow anonymous users (embed script) to read published layouts
CREATE POLICY "Published layouts are publicly readable"
  ON public.layouts
  FOR SELECT
  TO anon
  USING (status = 'published');
```

- [ ] **Step 2: Apply migration locally**

Run: `pnpm supabase db push` (or `pnpm supabase migration up` depending on your setup)
Expected: Migration applied successfully

- [ ] **Step 3: Verify policy**

Run from Supabase SQL editor or CLI:
```sql
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies WHERE tablename = 'layouts';
```
Expected: New row with `policyname = 'Published layouts are publicly readable'`, `roles = {anon}`, `cmd = SELECT`

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(embed): add RLS policy for anon read of published layouts"
```

---

### Task 12: Run All Tests & Final Verification

- [ ] **Step 1: Run full test suite**

Run: `cd packages/embed && pnpm test`
Expected: All tests pass (registry: 3, fetcher: 8, theme: 4, renderer: 6, WidgetLayout: 8, mount: 3 = ~32 tests)

- [ ] **Step 2: Run full build**

Run: `cd packages/embed && pnpm build`
Expected: `dist/index.mjs`, `dist/style.css`, `dist/embed.js` all exist

- [ ] **Step 3: Check bundle sizes**

Run: `ls -lh packages/embed/dist/`
Expected:
- `index.mjs` — under 100 KB (uncompressed, React external)
- `embed.js` — under 300 KB (uncompressed, React bundled)
- `style.css` — under 5 KB

- [ ] **Step 4: Verify main app still works**

Run: `pnpm build` (from root)
Expected: Main app builds without errors — embed package did not break anything

- [ ] **Step 5: Run main app tests**

Run: `pnpm test` (from root)
Expected: All existing tests still pass

- [ ] **Step 6: Commit any fixes**

If any fixes were needed, commit them.
