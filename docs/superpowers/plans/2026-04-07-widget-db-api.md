# Widget DB Schema + API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Supabase `widgets` table with RLS, TypeScript enums/types, a CRUD API service, and TanStack Query hooks.

**Architecture:** A Supabase migration creates the `widgets` table with category/resource enums, content/config JSONB, tags array, and public/private visibility. A thin `widgetApi.ts` wraps Supabase queries. Types and enums live in `src/lib/types.ts`. Query hooks in `src/lib/hooks/useWidgetQueries.ts`.

**Tech Stack:** Supabase (PostgreSQL, RLS), @supabase/supabase-js, @tanstack/react-query.

---

### Task 1: Apply Supabase migration

**Files:**
- No local files — migration via Supabase MCP

- [ ] **Step 1: Apply migration**

Use Supabase MCP `apply_migration` with project_id `kfttgjxvwiyzdekedhoy` and name `create_widgets_table`:

```sql
create table widgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Empty',
  description text not null default 'Empty widget',
  thumbnail   text,
  content     jsonb not null default '{"value": ""}',
  category    text not null default 'utility' check (category in ('media', 'data', 'content', 'embed', 'utility')),
  resource    text not null default 'empty' check (resource in ('youtube', 'image', 'iframe', 'component', 'empty')),
  config      jsonb not null default '{"isEditable": false, "isClonable": true}',
  tags        text[] not null default '{"empty", "widget", "default"}',
  status      text not null default 'draft' check (status in ('draft', 'published', 'deleted')),
  is_public   boolean not null default false,
  created_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid not null references auth.users(id)
);

create index widgets_user_id_idx on widgets(user_id);
create index widgets_status_idx on widgets(status);
create index widgets_category_idx on widgets(category);
create index widgets_is_public_idx on widgets(is_public);

alter table widgets enable row level security;

create policy "Owner can view own widgets"
  on widgets for select
  using (auth.uid() = user_id);

create policy "Public published widgets visible to authenticated"
  on widgets for select
  using (auth.role() = 'authenticated' and is_public = true and status = 'published');

create policy "Owner can insert own widgets"
  on widgets for insert
  with check (auth.uid() = user_id);

create policy "Owner can update own widgets"
  on widgets for update
  using (auth.uid() = user_id);

create policy "Owner can delete own widgets"
  on widgets for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Verify migration**

Use Supabase MCP `list_tables` to confirm `widgets` table exists.

---

### Task 2: Add TypeScript enums and WidgetRecord type

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Add enums and types**

Add to `src/lib/types.ts` after the `LayoutRecord` type:

```ts
// ─── Widget enums ─────────────────────────────────────────────────────────────

export const EWidgetCategory = {
  MEDIA: 'media',
  DATA: 'data',
  CONTENT: 'content',
  EMBED: 'embed',
  UTILITY: 'utility',
} as const;
export type EWidgetCategory = (typeof EWidgetCategory)[keyof typeof EWidgetCategory];

export const EWidgetResource = {
  YOUTUBE: 'youtube',
  IMAGE: 'image',
  IFRAME: 'iframe',
  COMPONENT: 'component',
  EMPTY: 'empty',
} as const;
export type EWidgetResource = (typeof EWidgetResource)[keyof typeof EWidgetResource];

// ─── Widget types ─────────────────────────────────────────────────────────────

export type WidgetContent = {
  value: string;
};

export type WidgetConfig = {
  isEditable: boolean;
  isClonable: boolean;
  css?: import('@/layout/types').WidgetBounds;
};

export type WidgetRecord = IEntityMeta & {
  id: string;
  user_id: IUser['id'];
  name: string;
  description: string;
  thumbnail: string | null;
  content: WidgetContent;
  category: EWidgetCategory;
  resource: EWidgetResource;
  config: WidgetConfig;
  tags: string[];
  status: LayoutStatus;
  is_public: boolean;
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(widget): add widget enums and WidgetRecord type"
```

---

### Task 3: Create widgetApi service

**Files:**
- Create: `src/lib/queries/widgetApi.ts`

- [ ] **Step 1: Create widgetApi.ts**

Create `src/lib/queries/widgetApi.ts`:

```ts
import type { IUser, WidgetRecord } from '@/lib/types';
import { supabase } from '@/lib/supabase';

async function currentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getWidgets(userId: IUser['id']): Promise<WidgetRecord[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getPublicWidgets(): Promise<WidgetRecord[]> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('is_public', true)
    .eq('status', 'published')
    .order('name');

  if (error) throw error;
  return (data ?? []) as WidgetRecord[];
}

export async function getWidget(id: string): Promise<WidgetRecord | null> {
  const { data, error } = await supabase
    .from('widgets')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as WidgetRecord;
}

export async function createWidget(widget: Partial<WidgetRecord>): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('widgets')
    .insert({
      user_id: userId,
      name: widget.name ?? 'Empty',
      description: widget.description ?? 'Empty widget',
      thumbnail: widget.thumbnail ?? null,
      content: widget.content ?? { value: '' },
      category: widget.category ?? 'utility',
      resource: widget.resource ?? 'empty',
      config: widget.config ?? { isEditable: false, isClonable: true },
      tags: widget.tags ?? ['empty', 'widget', 'default'],
      status: 'draft',
      is_public: widget.is_public ?? false,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as WidgetRecord;
}

export async function updateWidget(id: string, updates: Partial<WidgetRecord>): Promise<WidgetRecord> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('widgets')
    .update({
      ...updates,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as WidgetRecord;
}

export async function deleteWidget(id: string): Promise<void> {
  const userId = await currentUserId();
  const { error } = await supabase
    .from('widgets')
    .update({
      status: 'deleted',
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/queries/widgetApi.ts
git commit -m "feat(widget): create widgetApi CRUD service"
```

---

### Task 4: Create TanStack Query hooks

**Files:**
- Create: `src/lib/hooks/useWidgetQueries.ts`

- [ ] **Step 1: Create useWidgetQueries.ts**

Create `src/lib/hooks/useWidgetQueries.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { IUser, WidgetRecord } from '@/lib/types';
import * as api from '@/lib/queries/widgetApi';

const KEYS = {
  widgets: (userId: string) => ['widgets', userId] as const,
  publicWidgets: ['widgets', 'public'] as const,
  widget: (id: string) => ['widgets', 'detail', id] as const,
};

export function useWidgets(userId: IUser['id'] | undefined) {
  return useQuery({
    queryKey: KEYS.widgets(userId!),
    queryFn: () => api.getWidgets(userId!),
    enabled: !!userId,
  });
}

export function usePublicWidgets() {
  return useQuery({
    queryKey: KEYS.publicWidgets,
    queryFn: api.getPublicWidgets,
  });
}

export function useWidget(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.widget(id!),
    queryFn: () => api.getWidget(id!),
    enabled: !!id,
  });
}

export function useCreateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WidgetRecord>) => api.createWidget(data),
    onSuccess: (created) => {
      queryClient.setQueryData(KEYS.widget(created.id), created);
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}

export function useUpdateWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WidgetRecord> }) => api.updateWidget(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(KEYS.widget(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}

export function useDeleteWidget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteWidget(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['widgets'] });
    },
  });
}
```

- [ ] **Step 2: Verify build and tests**

Run: `pnpm build && pnpm test`
Expected: Both pass.

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/useWidgetQueries.ts
git commit -m "feat(widget): create TanStack Query hooks for widgets"
```
