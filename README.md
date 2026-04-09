[![Pipeline](https://github.com/teamco/iLayout/actions/workflows/pipeline.yml/badge.svg)](https://github.com/teamco/iLayout/actions/workflows/pipeline.yml)
[![Publish to NPM](https://github.com/teamco/iLayout/actions/workflows/publish.yml/badge.svg)](https://github.com/teamco/iLayout/actions/workflows/publish.yml)

# iLayout

Widget-based layout builder with drag-and-drop, authentication, role-based permissions, and multi-language support.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 8, Ant Design 6
- **State:** Zustand + Immer
- **Routing:** TanStack Router
- **Data Fetching:** TanStack Query
- **Auth:** Supabase Auth (email, magic link, Google/GitHub OAuth)
- **Database:** Supabase (PostgreSQL + RLS)
- **Permissions:** CASL (@casl/ability + @casl/react)
- **i18n:** i18next + react-i18next (EN, RU, HE with RTL)
- **DnD:** @dnd-kit/core
- **Styling:** Less modules + CSS custom properties (light/dark/system theme)

## Getting Started

```bash
pnpm install
cp .env.example .env   # fill in Supabase credentials
pnpm dev
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key |
| `VITE_ADMINS` | Comma-separated admin emails |

## Commands

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # Type-check + bundle (tsc -b && vite build)
pnpm lint         # Run ESLint
pnpm test         # Run tests (vitest)
pnpm preview      # Preview production build
```

## Embed Package

Embed published layouts on any website with a React component or `<script>` tag.

[![npm](https://img.shields.io/npm/v/@teamco/anthill-layout-embed)](https://www.npmjs.com/package/@teamco/anthill-layout-embed)

```html
<script src="https://unpkg.com/@teamco/anthill-layout-embed/dist/embed.js"></script>
<div data-widget-layout="your-layout-id"></div>
```

See full docs: [packages/embed/README.md](./packages/embed/README.md)

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system architecture.

## Testing

See [TESTING.md](./TESTING.md) for testing patterns and standards.

## Project Structure

```
src/
  auth/               # Auth context, CASL abilities, Can component
  components/         # Shared components (AppHeader, PageLayout, Table)
  i18n/               # i18next config + locale files (en, ru, he)
  layout/             # Layout builder (components, store, DnD, grid, utils)
  lib/                # Supabase client, API services, hooks, types
  pages/              # Route pages (Home, Profile, LayoutEditor, WidgetEditor)
  themes/             # Theme store (light/dark/system)
  widgets/            # Modular widget system (empty, youtube, image)
```

## Documentation

### Design Specs

- [Layout Builder](./docs/superpowers/specs/2026-03-24-layout-builder-design.md)
- [Grid Overlay](./docs/superpowers/specs/2026-04-05-grid-overlay-design.md)
- [Snap-to-Grid](./docs/superpowers/specs/2026-04-05-snap-to-grid-design.md)
- [Theme Switcher](./docs/superpowers/specs/2026-04-05-theme-switcher-design.md)
- [Layout JSON Modal](./docs/superpowers/specs/2026-04-06-layout-json-modal-design.md)
- [Supabase Auth](./docs/superpowers/specs/2026-04-06-supabase-auth-design.md)
- [Layout DB + API](./docs/superpowers/specs/2026-04-06-layout-db-api-design.md)
- [Layout Routing + UI](./docs/superpowers/specs/2026-04-06-layout-routing-ui-design.md)
- [CASL Integration](./docs/superpowers/specs/2026-04-06-casl-integration-design.md)
- [Widget DB + API](./docs/superpowers/specs/2026-04-07-widget-db-api-design.md)
- [Widget Table + Editor](./docs/superpowers/specs/2026-04-07-widget-table-editor-design.md)
- [Widget Directory + Renderer](./docs/superpowers/specs/2026-04-07-widget-directory-renderer-design.md)
- [Layout Modes](./docs/superpowers/specs/2026-04-07-layout-modes-design.md)
- [Scroll Layout UI](./docs/superpowers/specs/2026-04-07-scroll-layout-ui-design.md)
- [Embed Package](./docs/superpowers/specs/2026-04-09-embed-package-design.md)

### Implementation Plans

- [Grid Overlay](./docs/superpowers/plans/2026-04-05-grid-overlay.md)
- [Snap-to-Grid](./docs/superpowers/plans/2026-04-05-snap-to-grid.md)
- [Theme Switcher](./docs/superpowers/plans/2026-04-05-theme-switcher.md)
- [Layout JSON Modal](./docs/superpowers/plans/2026-04-06-layout-json-modal.md)
- [Supabase Auth](./docs/superpowers/plans/2026-04-06-supabase-auth.md)
- [Layout DB + API](./docs/superpowers/plans/2026-04-06-layout-db-api.md)
- [Layout Routing + UI](./docs/superpowers/plans/2026-04-06-layout-routing-ui.md)
- [CASL Integration](./docs/superpowers/plans/2026-04-06-casl-integration.md)
- [Widget DB + API](./docs/superpowers/plans/2026-04-07-widget-db-api.md)
- [Widget Table + Editor](./docs/superpowers/plans/2026-04-07-widget-table-editor.md)
- [Widget Directory + Renderer](./docs/superpowers/plans/2026-04-07-widget-directory-renderer.md)
- [Layout Modes — Types + Store](./docs/superpowers/plans/2026-04-07-layout-modes-types-store.md)
- [Horizontal Grid](./docs/superpowers/plans/2026-04-07-horizontal-grid.md)
- [Scroll Layout UI](./docs/superpowers/plans/2026-04-07-scroll-layout-ui.md)
- [Embed Package](./docs/superpowers/plans/2026-04-09-embed-package.md)

### Session Notes

- [Grid, Snap, Theme, Auth Session](./docs/sessions/2026-04-05-grid-snap-theme-auth.md)

## License

[MIT](./LICENSE)
