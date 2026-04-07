# Testing Guide & Standards

This document establishes testing patterns, standards, and best practices for the iLayout project.

## Testing Philosophy

**Goal**: Comprehensive, maintainable tests that catch regressions and ensure code quality
**Approach**: Test behavior, not implementation details
**Coverage**: Aim for high test coverage with focus on critical business logic

## Testing Stack

- **Test Runner**: Vitest
- **Testing Library**: React Testing Library + User Events
- **Mocking**: Vitest mocking utilities
- **Assertions**: Vitest expect assertions
- **Setup**: Custom test utilities and global setup (`src/test-setup.ts`)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (for development)
pnpm test:watch

# Run specific test file
pnpm test -- src/layout/store/__tests__/layoutStore.test.ts

# Run tests matching pattern
pnpm test -- snapToGrid
```

### Best Practices

- Run before commits — ensure no regressions
- Use watch mode during development — immediate feedback
- Don't delete tests — adapt them when code changes

## Test Organization

### File Structure

```
src/
├── layout/
│   ├── store/
│   │   └── __tests__/
│   │       └── layoutStore.test.ts
│   ├── utils/
│   │   └── __tests__/
│   │       └── treeUtils.test.ts
│   └── grid/
│       └── __tests__/
│           └── snapToGrid.test.ts
├── themes/
│   └── __tests__/
│       └── themeStore.test.ts
├── components/
│   └── Table/
│       └── __tests__/
│           └── (table utility tests)
└── __tests__/
    └── (global test setup)
```

### Naming Conventions

- **Unit Tests**: `*.test.ts` or `*.test.tsx`
- **Test Location**: `__tests__/` subfolder next to the module they test
- **Imports**: Use `../` to reach the module under test
- **Test IDs**: `data-testid="component-name"` (kebab-case)

## Maintenance & Update Policy

Always keep this TESTING.md up to date when you:

- Create a new, successful testing flow for a component, hook, or utility
- Fix failing tests by introducing a new mocking pattern
- Discover a recurring pitfall or environment gotcha

Quick checklist after a successful test flow or fix:

- What pattern or mock did we add/change?
- Why is this needed?
- Where is it used?
- Any caveats or limits?

## Testing Patterns

### Zustand Store Testing

The layout store uses Zustand + Immer. Use the `createLayoutStore()` factory for isolated test instances.

```ts
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createLayoutStore } from '../layoutStore';

describe('layoutStore', () => {
  it('performs action correctly', () => {
    const store = createLayoutStore();
    act(() => store.getState().someAction());
    expect(store.getState().someValue).toBe(expected);
  });
});
```

Key patterns:
- Always wrap state mutations in `act()`
- Use `createLayoutStore()` (not `useLayoutStore` singleton) for test isolation
- Each test gets a fresh store instance
- For scroll mode tests, use `as unknown as ScrollRoot` casts for Immer draft compatibility

Example: `src/layout/store/__tests__/layoutStore.test.ts`

### Pure Utility Testing

Pure functions (no React, no DOM) — straightforward input/output tests.

```ts
import { describe, it, expect } from 'vitest';
import { snapToGrid, getGridEdges } from '../snapToGrid';

describe('snapToGrid', () => {
  it('preserves total size', () => {
    const sizes = [300, 400, 300];
    const result = snapToGrid(sizes, 0, 1000, 24, 16);
    const sum = result.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1000);
  });
});
```

Key patterns:
- Use `toBeCloseTo` for floating point comparisons
- Test edge cases: empty inputs, zero values, boundary conditions
- Test invariants: sum preservation, minimum sizes, etc.

Example: `src/layout/grid/__tests__/snapToGrid.test.ts`

### Theme Store Testing

Theme store uses simple Zustand (no Immer). Mock `matchMedia` and `localStorage` for testing system theme detection and persistence.

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createThemeStore } from '../themeStore';

describe('themeStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('resolves system to dark when matchMedia matches', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const store = createThemeStore();
    expect(store.getState().resolvedTheme).toBe('dark');
    vi.unstubAllGlobals();
  });
});
```

Example: `src/themes/__tests__/themeStore.test.ts`

### Component Testing Template

```tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComponentName } from '../ComponentName';

// Mock dependencies
vi.mock('@/hooks/useHook', () => ({
  useHook: vi.fn(),
}));

describe('ComponentName', () => {
  const mockProps = {
    prop1: 'value1',
    onAction: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct initial state', () => {
    render(<ComponentName {...mockProps} />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  it('handles user interactions correctly', async () => {
    const user = userEvent.setup();
    render(<ComponentName {...mockProps} />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(mockProps.onAction).toHaveBeenCalledWith('expected-value');
  });
});
```

### Modal and Ant Design Dependencies

When testing components with Ant Design `Modal`, mock to a simple container:

```tsx
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Modal: ({ open, title, onCancel, children }: any) =>
      open ? (
        <div data-testid="antd-modal">
          <div role="heading">{title}</div>
          <button aria-label="close" onClick={() => onCancel?.()} />
          {children}
        </div>
      ) : null,
  };
});
```

### Mocking Supabase

For tests involving Supabase API calls:

```ts
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));
```

### Mocking TanStack Router

```ts
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ layoutId: 'test-layout-id' }),
  useMatches: () => [{ fullPath: '/profile/layouts' }],
  useLocation: () => ({ pathname: '/profile/layouts', search: '' }),
  Outlet: () => null,
}));
```

### Mocking CASL Abilities

```ts
vi.mock('@/auth/abilityContext', () => ({
  useAbility: () => ({
    can: vi.fn().mockReturnValue(true),
  }),
  AbilityContext: { Consumer: ({ children }: any) => children({ can: () => true }) },
}));
```

### Mocking i18next

```ts
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));
```

## Existing Test Coverage

| Area | File | Tests | Description |
|------|------|-------|-------------|
| Layout Store | `layoutStore.test.ts` | 48 | Panel CRUD, widget management, mode switching, section actions |
| Tree Utils | `treeUtils.test.ts` | varies | findNode, splitNode, removeNode, updateNode |
| Grid Snap | `snapToGrid.test.ts` | varies | Grid edges, snap-to-grid, horizontal grid, nearest edge |
| Theme Store | `themeStore.test.ts` | 7 | Theme cycling, system resolution, localStorage persistence |

## Adding New Tests

When adding a new feature:

1. Create `__tests__/` folder next to the module
2. Name file `*.test.ts` or `*.test.tsx`
3. Follow existing patterns from this document
4. Run `pnpm test` to verify all tests pass
5. Update this document if you introduce a new pattern

## Critical Notes

- **Never delete existing tests** — adapt them when code changes
- **TypeScript strict mode** — use `as const` objects, not enums
- **Immer drafts** — use `as unknown as Type` for casting in store tests
- **Ant Design 6** — `orientation` not `direction` for Space, `destroyOnHidden` not `destroyInactiveTabPane`
