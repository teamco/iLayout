# Layout Modes — Types + Store + DB (Plan A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `LayoutMode`, `SectionNode`, `ScrollRoot` types, section management actions to the layout store, and a DB migration for the `mode` column.

**Architecture:** New types extend the existing `LayoutNode` union. Store gains section CRUD actions + mode switching with conversion logic. DB gets a `mode` column with default `'viewport'`.

**Tech Stack:** TypeScript types, Zustand + Immer store, Supabase migration.

---

### Task 1: Supabase migration — add `mode` column

**Files:**
- No local files — migration via Supabase MCP

- [ ] **Step 1: Apply migration**

Use Supabase MCP `apply_migration` with project_id `kfttgjxvwiyzdekedhoy` and name `add_mode_to_layouts`:

```sql
alter table layouts add column mode text not null default 'viewport' check (mode in ('viewport', 'scroll'));
```

- [ ] **Step 2: Verify**

Use `execute_sql` to confirm: `select column_name, column_default from information_schema.columns where table_name = 'layouts' and column_name = 'mode';`

---

### Task 2: Add types to layout/types.ts

**Files:**
- Modify: `src/layout/types.ts`

- [ ] **Step 1: Add new types**

Add after the existing `SplitterNode` type and before `LayoutNode`:

```ts
// ─── Layout modes ─────────────────────────────────────────────────────────────

export type LayoutMode = 'viewport' | 'scroll';

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
```

Update `LayoutNode` union:

```ts
export type LayoutNode = LeafNode | SplitterNode | SectionNode | ScrollRoot;
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/types.ts
git commit -m "feat(layout-modes): add LayoutMode, SectionNode, ScrollRoot types"
```

---

### Task 3: Add LayoutMode to LayoutRecord

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add mode field**

In `src/lib/types.ts`, add `mode` to `LayoutRecord`:

```ts
export type LayoutRecord = IEntityMeta & {
  id: string;
  user_id: IUser['id'];
  version: number;
  status: LayoutStatus;
  data: LayoutNode;
  is_private: boolean;
  mode: import('@/layout/types').LayoutMode;
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(layout-modes): add mode to LayoutRecord"
```

---

### Task 4: Add section actions to layoutStore

**Files:**
- Modify: `src/layout/store/layoutStore.ts`

- [ ] **Step 1: Add layoutMode state and section actions**

In `src/layout/store/layoutStore.ts`:

Add imports:
```ts
import type { LayoutNode, SplitDirection, WidgetRef, LayoutMode, SectionNode, SectionHeight, ScrollRoot } from '../types';
```

Add to `LayoutState`:
```ts
  layoutMode: LayoutMode;
```

Add to `LayoutActions`:
```ts
  setLayoutMode: (mode: LayoutMode) => void;
  addSection: (position: 'before' | 'after', targetSectionId: string) => void;
  removeSection: (sectionId: string) => void;
  resizeSection: (sectionId: string, height: SectionHeight) => void;
  updateSectionConfig: (sectionId: string, config: Partial<Pick<SectionNode, 'overlap' | 'zIndex'>>) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
```

Add initial state `layoutMode: 'viewport'` to both `createLayoutStore` and `useLayoutStore`.

Add implementations in `makeActions`:

```ts
setLayoutMode(mode) {
  set(state => {
    if (state.layoutMode === mode) return;
    if (mode === 'scroll' && state.root.type !== 'scroll') {
      // Wrap current root in a single section
      const section: SectionNode = {
        id: nanoid(),
        type: 'section',
        height: { type: 'fixed', value: '100vh' },
        child: state.root,
      };
      state.root = {
        id: nanoid(),
        type: 'scroll',
        sections: [section],
      } as ScrollRoot;
    } else if (mode === 'viewport' && state.root.type === 'scroll') {
      // Take first section's child as new root
      const scrollRoot = state.root as ScrollRoot;
      state.root = scrollRoot.sections[0]?.child ?? { id: nanoid(), type: 'leaf' };
    }
    state.layoutMode = mode;
  });
},

addSection(position, targetSectionId) {
  set(state => {
    if (state.root.type !== 'scroll') return;
    const scrollRoot = state.root as ScrollRoot;
    const idx = scrollRoot.sections.findIndex(s => s.id === targetSectionId);
    if (idx === -1) return;
    const newSection: SectionNode = {
      id: nanoid(),
      type: 'section',
      height: { type: 'auto' },
      child: { id: nanoid(), type: 'leaf' },
    };
    const insertAt = position === 'before' ? idx : idx + 1;
    scrollRoot.sections.splice(insertAt, 0, newSection);
  });
},

removeSection(sectionId) {
  set(state => {
    if (state.root.type !== 'scroll') return;
    const scrollRoot = state.root as ScrollRoot;
    if (scrollRoot.sections.length <= 1) return; // keep at least one
    scrollRoot.sections = scrollRoot.sections.filter(s => s.id !== sectionId);
  });
},

resizeSection(sectionId, height) {
  set(state => {
    if (state.root.type !== 'scroll') return;
    const scrollRoot = state.root as ScrollRoot;
    const section = scrollRoot.sections.find(s => s.id === sectionId);
    if (section) section.height = height;
  });
},

updateSectionConfig(sectionId, config) {
  set(state => {
    if (state.root.type !== 'scroll') return;
    const scrollRoot = state.root as ScrollRoot;
    const section = scrollRoot.sections.find(s => s.id === sectionId);
    if (!section) return;
    if (config.overlap !== undefined) section.overlap = config.overlap;
    if (config.zIndex !== undefined) section.zIndex = config.zIndex;
  });
},

reorderSections(fromIndex, toIndex) {
  set(state => {
    if (state.root.type !== 'scroll') return;
    const scrollRoot = state.root as ScrollRoot;
    const [moved] = scrollRoot.sections.splice(fromIndex, 1);
    scrollRoot.sections.splice(toIndex, 0, moved);
  });
},
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/store/layoutStore.ts
git commit -m "feat(layout-modes): add layoutMode state and section actions to store"
```

---

### Task 5: Add tests for section actions

**Files:**
- Modify: `src/layout/store/__tests__/layoutStore.test.ts`

- [ ] **Step 1: Add section action tests**

Add to `src/layout/store/__tests__/layoutStore.test.ts`:

```ts
import type { ScrollRoot, SectionNode } from '../../types';

describe('layout modes', () => {
  it('defaults to viewport mode', () => {
    const store = createLayoutStore();
    expect(store.getState().layoutMode).toBe('viewport');
  });

  it('switches to scroll mode wrapping root in a section', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    expect(store.getState().layoutMode).toBe('scroll');
    expect(store.getState().root.type).toBe('scroll');
    const scrollRoot = store.getState().root as ScrollRoot;
    expect(scrollRoot.sections).toHaveLength(1);
    expect(scrollRoot.sections[0].type).toBe('section');
    expect(scrollRoot.sections[0].height).toEqual({ type: 'fixed', value: '100vh' });
  });

  it('switches back to viewport taking first section child', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    act(() => store.getState().setLayoutMode('viewport'));
    expect(store.getState().layoutMode).toBe('viewport');
    expect(store.getState().root.type).toBe('leaf');
  });

  it('adds a section before target', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('before', firstId));
    const updated = store.getState().root as ScrollRoot;
    expect(updated.sections).toHaveLength(2);
    expect(updated.sections[1].id).toBe(firstId);
  });

  it('adds a section after target', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    const updated = store.getState().root as ScrollRoot;
    expect(updated.sections).toHaveLength(2);
    expect(updated.sections[0].id).toBe(firstId);
  });

  it('removes a section (keeps at least one)', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    const twoSections = store.getState().root as ScrollRoot;
    expect(twoSections.sections).toHaveLength(2);
    act(() => store.getState().removeSection(twoSections.sections[1].id));
    expect((store.getState().root as ScrollRoot).sections).toHaveLength(1);
    // Cannot remove last section
    act(() => store.getState().removeSection(firstId));
    expect((store.getState().root as ScrollRoot).sections).toHaveLength(1);
  });

  it('resizes a section', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const sectionId = scrollRoot.sections[0].id;
    act(() => store.getState().resizeSection(sectionId, { type: 'fixed', value: '500px' }));
    const updated = store.getState().root as ScrollRoot;
    expect(updated.sections[0].height).toEqual({ type: 'fixed', value: '500px' });
  });

  it('updates section config (overlap, zIndex)', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const sectionId = scrollRoot.sections[0].id;
    act(() => store.getState().updateSectionConfig(sectionId, { overlap: '-30px', zIndex: 5 }));
    const updated = store.getState().root as ScrollRoot;
    expect(updated.sections[0].overlap).toBe('-30px');
    expect(updated.sections[0].zIndex).toBe(5);
  });

  it('reorders sections', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    act(() => store.getState().addSection('after', firstId));
    const three = store.getState().root as ScrollRoot;
    const ids = three.sections.map(s => s.id);
    act(() => store.getState().reorderSections(0, 2));
    const reordered = store.getState().root as ScrollRoot;
    expect(reordered.sections[2].id).toBe(ids[0]);
  });
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm test`
Expected: ALL PASS.

- [ ] **Step 3: Commit**

```bash
git add src/layout/store/__tests__/layoutStore.test.ts
git commit -m "test(layout-modes): add tests for section actions and mode switching"
```
