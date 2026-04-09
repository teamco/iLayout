# @anthill-layout/embed — Client Integration Package

**Status:** Approved  
**Date:** 2026-04-09

## Overview

Render-only package for embedding published layouts on client websites. Two distribution formats: npm package (React component) and IIFE script tag (vanilla HTML auto-mount). No editor, no DnD, no auth, no antd — lightweight read-only rendering.

## Requirements

- **Two channels:** npm package for developers, `<script>` tag for non-developers
- **Two data sources:** API fetch by layoutId, self-hosted (inline JSON or URL)
- **Two display modes:** full-page (viewport) and container (embedded in a div)
- **Themeable:** client passes custom theme via props or CSS custom properties
- **Extensible:** built-in widgets now, architecture supports future custom widget registration
- **Both layout modes:** viewport (splitter-based) and scroll (section-based)

## 1. Package Structure

```
packages/
  embed/
    src/
      WidgetLayout.tsx        # Main React component
      mount.ts                # Vanilla JS: finds [data-widget-layout], mounts React
      fetcher.ts              # Layout JSON loading (API / URL / inline)
      renderer/
        EmbedLayoutRenderer.tsx   # Recursive tree → DOM
        EmbedSplitter.tsx         # CSS flex instead of antd Splitter
        EmbedLeaf.tsx             # Widget container, no overlay/edit UI
        EmbedScrollLayout.tsx     # Vertical sections (scroll mode)
        EmbedWidgetRenderer.tsx   # getWidgetDef() → component
      widgets/                # Built-in widgets (re-export from shared)
      theme.ts                # Theme prop → CSS custom properties mapping
      index.ts                # npm entry: export { WidgetLayout }
      embed.ts                # IIFE entry: auto-mount + window.WidgetLayout
    package.json
    vite.config.ts            # Library mode: ESM + IIFE builds
  shared/
    src/
      types/                  # LayoutNode, LeafNode, SplitterNode, etc.
      widgets/                # Widget registry, definitions, components
```

Shared code (types and widgets) lives in `packages/shared` — used by both the main app and embed package.

## 2. API

### React (npm)

```tsx
import { WidgetLayout } from '@anthill-layout/embed';

// By layoutId — fetches from API
<WidgetLayout layoutId="abc-123" />

// Inline JSON
<WidgetLayout layout={myLayoutJson} />

// URL to self-hosted JSON
<WidgetLayout layoutUrl="https://cdn.example.com/layout.json" />

// Full-page mode
<WidgetLayout layoutId="abc-123" fullPage />

// Custom theme
<WidgetLayout
  layoutId="abc-123"
  theme={{
    colorPrimary: '#1a73e8',
    colorBg: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    borderRadius: 8,
  }}
/>

// Custom API endpoint (self-hosted backend)
<WidgetLayout layoutId="abc-123" apiBase="https://my-api.com" />
```

### Script tag (non-devs)

```html
<script src="https://cdn.anthill-layout.app/embed.js"></script>

<!-- Minimal -->
<div data-widget-layout="abc-123"></div>

<!-- With parameters -->
<div
  data-widget-layout="abc-123"
  data-full-page="true"
  data-theme='{"colorPrimary":"#1a73e8","fontFamily":"Inter"}'
  data-api-base="https://my-api.com"
></div>

<!-- Self-hosted JSON -->
<div data-widget-layout-url="https://cdn.example.com/layout.json"></div>
```

`embed.js` on load finds all `[data-widget-layout]` and `[data-widget-layout-url]` elements and mounts React into each. Also exposes `window.AntHillLayout.mount(element, props)` for programmatic use from vanilla JS.

### Props table

| Prop (React) | data-attr (HTML) | Description |
|---|---|---|
| `layoutId` | `data-widget-layout` | Layout ID, fetch from API |
| `layout` | — | Inline JSON (React only) |
| `layoutUrl` | `data-widget-layout-url` | URL to JSON file |
| `fullPage` | `data-full-page` | Stretch to full viewport |
| `theme` | `data-theme` | Theme object (JSON string in HTML) |
| `apiBase` | `data-api-base` | Custom API endpoint |
| `onLoad` | — | Callback after load (React only) |
| `onError` | — | Callback on error (React only) |

**Priority:** `layout` (inline) > `layoutUrl` > `layoutId`. If multiple provided, highest priority wins.

## 3. Renderer

The embed renderer is a lightweight fork — **no antd, no Zustand store, no DnD, no edit UI**.

### Components

| Component | Replaces | Implementation |
|---|---|---|
| `EmbedLayoutRenderer` | `LayoutRenderer` | Recursive tree walker, no store dependency |
| `EmbedSplitter` | `SplitterNodeComponent` | CSS `display: flex` with `flex-basis: {size}%` |
| `EmbedLeaf` | `LeafNodeComponent` | Widget container, no overlay/edit controls |
| `EmbedScrollLayout` | `ScrollLayout` | Vertical sections container |
| `EmbedWidgetRenderer` | `WidgetRenderer` | `getWidgetDef()` → component, no edit logic |

### Why not antd Splitter?

Antd is ~200 KB. Embed splitters are read-only (fixed sizes from builder), so CSS flex with percentage-based `flex-basis` is sufficient. No resize handles needed.

### Rendering rules

```
SplitterNode → <div class="al-splitter al-splitter--{direction}" style="display:flex; flex-direction:row|column">
                 children → <div class="al-panel" style="flex-basis:{size}%">
LeafNode     → <div class="al-leaf"> → EmbedWidgetRenderer
ScrollRoot   → <div class="al-scroll"> → sections vertically
SectionNode  → <div class="al-section" style="height:{...}; margin-top:{overlap}; z-index:{z}">
```

### CSS prefix

All classes use `al-` prefix (anthill-layout) to prevent conflicts with host page styles.

## 4. Data Fetching & Caching

### Three fetch strategies

1. **`layoutId`** → `GET {apiBase}/rest/v1/layouts?id=eq.{id}&status=eq.published&order=version.desc&limit=1`
2. **`layoutUrl`** → `fetch(url)` → parse JSON
3. **`layout`** → use directly (inline, React only)

### Implementation details

- **Direct PostgREST** — no `@supabase/supabase-js` dependency, raw fetch with anon key in `apikey` header
- **In-memory cache** — `Map<string, { data: LayoutNode, timestamp: number }>`, TTL 5 minutes
- **Request deduplication** — concurrent requests for same key share one Promise
- **No TanStack Query** — embed must be self-contained

### Loading states

- `loading` — CSS-animated skeleton placeholder
- `error` — error message with retry button
- `ready` — render layout

### RLS policy for anon access

New Supabase RLS policy required:

```sql
CREATE POLICY "Published layouts are publicly readable"
  ON layouts FOR SELECT
  TO anon
  USING (status = 'published');
```

This allows the embed script to fetch published layouts without authentication.

## 5. Theming

### Theme type

```ts
type WidgetLayoutTheme = {
  colorPrimary?: string;     // --al-color-primary
  colorBg?: string;          // --al-color-bg
  colorText?: string;        // --al-color-text
  colorBorder?: string;      // --al-color-border
  fontFamily?: string;       // --al-font-family
  fontSize?: number;         // --al-font-size (px)
  borderRadius?: number;     // --al-border-radius (px)
  spacing?: number;          // --al-spacing (px) — gap between panels
};
```

### Mechanism

Theme prop is mapped to CSS custom properties on the root element:

```html
<div class="al-root" style="
  --al-color-primary: #1a73e8;
  --al-color-bg: #ffffff;
  --al-font-family: Inter, sans-serif;
  --al-border-radius: 8px;
">
  ...layout tree...
</div>
```

### Default values (fallbacks in CSS)

```css
.al-root {
  --al-color-primary: #1677ff;
  --al-color-bg: #ffffff;
  --al-color-text: #1f1f1f;
  --al-color-border: #e8e8e8;
  --al-font-family: -apple-system, sans-serif;
  --al-font-size: 14px;
  --al-border-radius: 6px;
  --al-spacing: 0px;

  font-family: var(--al-font-family);
  font-size: var(--al-font-size);
  color: var(--al-color-text);
  background: var(--al-color-bg);
}
```

### CSS override (without theme prop)

Clients can also override variables directly in their CSS:

```css
.al-root {
  --al-color-primary: red;
  --al-font-family: 'Comic Sans MS';
}
```

### Display modes

- **`fullPage`** — `position: fixed; inset: 0; width: 100vw; height: 100vh;`
- **Container (default)** — `width: 100%; height: 100%;` — client controls size via parent div

## 6. Build & Distribution

### Vite Library Mode

Two builds from one package:

**ESM (npm):**
- Entry: `src/index.ts`
- Output: `dist/index.mjs` + `dist/index.d.ts`
- React, react-dom as `peerDependencies` (not bundled)
- Tree-shakeable
- ~15-30 KB gzipped

**IIFE (script tag):**
- Entry: `src/embed.ts`
- Output: `dist/embed.js`
- React, react-dom **bundled inside**
- Single file, zero external dependencies
- ~60-80 KB gzipped

### package.json

```json
{
  "name": "@anthill-layout/embed",
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
  }
}
```

### CDN

```html
<script src="https://cdn.anthill-layout.app/embed.js"></script>
<!-- or via npm CDN -->
<script src="https://unpkg.com/@anthill-layout/embed/dist/embed.js"></script>
```

### Monorepo

pnpm workspace — root `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
```

## 7. Scope

### In scope (first iteration)

- `packages/embed` — React component `<WidgetLayout />`
- `packages/embed` — IIFE bundle with auto-mount for `<script>` tag
- `packages/shared` — shared types and widget definitions
- Read-only renderer (CSS flex, no antd)
- Fetcher: layoutId (API) / layoutUrl / inline JSON
- Theming via `--al-*` CSS custom properties
- fullPage / container display modes
- Viewport and scroll layout modes
- Loading skeleton + error state with retry
- New RLS policy for anon access to published layouts
- pnpm workspace setup

### Out of scope

- Custom widget registration (client-provided components) — future iteration
- SSR / Server Components support
- Analytics / tracking of embeds
- Embed API versioning (v1/v2)
- Edit mode in embed (always read-only)
- Responsive breakpoints (layout renders as-is)
- Migration of main app into `packages/app` — separate task if needed
