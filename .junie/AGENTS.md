# Agent Development Guide

This document provides project-specific details for advanced developers and AI agents working on **iLayout (anthill)**.

## 🛠 Build & Configuration

The project is a Vite-powered React application using TypeScript and `pnpm` for package management.

### Commands

- `pnpm dev`: Starts the development server with HMR.
- `pnpm build`: Runs `tsc -b` and `vite build` for a production bundle.
- `pnpm lint`: Runs ESLint for the whole project.
- `pnpm format`: Formats code with Prettier.
- `pnpm preview`: Previews the production build locally.
- `pnpm test`: Runs all tests once (Vitest).
- `pnpm test:watch`: Runs tests in watch mode.

### Environment Variables

Copy `.env.example` to `.env` and fill in:

- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`: Supabase publishable key.
- `VITE_ADMINS`: Comma-separated admin emails (for CASL role determination).

### Key Technologies

- **Vite 8**: Build tool and dev server.
- **React 19**: Frontend framework.
- **Supabase**: Auth, PostgreSQL database, and RLS (client in `src/lib/supabase.ts`).
- **TanStack Router**: Type-safe routing (routes in `src/routes/`).
- **TanStack Query**: Data fetching and caching (hooks in `src/lib/hooks/`).
- **Ant Design 6 (antd)**: UI component library.
- **Zustand + Immer**: Client state management (stores in `src/layout/store/`, `src/themes/`).
- **CASL**: Permissions and authorization (integration in `src/lib/casl.ts`).
- **i18next**: Internationalization (EN, RU, HE with RTL support).

---

## 🧪 Testing

The project uses **Vitest** with **JSDOM** and **React Testing Library**.

### Running Tests

- `npm test`: Runs all tests once.
- `npm run test:watch`: Runs tests in watch mode.
- To run a specific test file: `pnpm test <path-to-file>`.

### Configuration

- `vitest.config.ts`: Main test configuration.
- `src/test-setup.ts`: Sets up global mocks (e.g., `localStorage`, `sessionStorage`) and `@testing-library/jest-dom`.
- Alias `@` is configured to point to `src/`.

### Guidelines

- **Ant Design Mocking**: Standard `antd` components (Modals, Tabs) may be difficult to test in JSDOM. Use/extend the custom mock in `__tests__/antd.tsx`.
- **Hooks Testing**: Use `renderHook` from `@testing-library/react`.
- **Naming**: All test files go in a `__tests__/` subfolder next to the module they test. Name file `*.test.tsx` or `*.test.ts`.
- **State Testing**: Wrap state mutations in `act()`. Use factories (e.g., `createLayoutStore()`) instead of singletons for test isolation.
- **Strict Typing**: For Immer drafts, use `as unknown as Type` for casting in store tests.
- **Supabase Mocking**: Use `vi.mock('@/lib/supabase', ...)` to mock auth and database calls.
- **Router Mocking**: Use `vi.mock('@tanstack/react-router', ...)` to mock `useNavigate`, `useParams`, etc.

### Critical Gotchas

- **Ant Design 6 API**: `Drawer` uses `size`, not `width`. `Splitter` uses `orientation`, not `layout`. `Space` uses `orientation`, not `direction`.
- **Theme Switcher**: `data-theme` is set synchronously at module load to prevent FOUC.
- **RTL Support**: Ant Design `ConfigProvider` handles RTL direction based on active language.

### Example Test (Verified)

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth, AuthContext } from '@/lib/hooks/useAuth';
import React from 'react';

describe('useAuth', () => {
  it('should return context value', () => {
    const mockValue = {
      session: null,
      user: null,
      loading: false,
      signOut: async () => {},
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBe(mockValue);
  });
});
```

---

## ✍️ Development Information

### Code Style

- **TypeScript**: Strict typing is preferred.
- **Functional Components**: Use functional components with hooks.
- **Imports**: Use `@/` alias for paths under `src/`.
- **Icons**: Use `@ant-design/icons`.

### Architecture

- `src/layout/`: Core layout builder (SplitterNode, ScrollLayout, Store).
- `src/widgets/`: Modular widget system (registry and implementation).
- `src/pages/`: Route components (Home, Profile, LayoutEditor, WidgetEditor).
- `src/lib/hooks/`: Reusable business logic (API queries/mutations).
- `src/components/`: Shared UI components (AppHeader, PageLayout, Table).
- `docs/`: Design specs and implementation plans.
