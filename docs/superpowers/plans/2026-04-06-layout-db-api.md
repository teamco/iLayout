# Layout Database Schema + API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the Supabase `layouts` table with RLS policies, TypeScript types, a CRUD API service, and a dayjs date formatting utility.

**Architecture:** A Supabase migration creates the `layouts` table with composite PK `(id, version)` and RLS. A thin `layoutApi.ts` service wraps Supabase client queries. Types live in `src/lib/types.ts`. Date formatting uses dayjs via `src/lib/formatDate.ts`.

**Tech Stack:** Supabase (PostgreSQL, RLS), @supabase/supabase-js, dayjs, Vitest.

---

### Task 1: Apply Supabase migration

**Files:**

- No local files — migration applied via Supabase MCP

- [ ] **Step 1: Apply migration**

Use Supabase MCP `apply_migration` with project_id `kfttgjxvwiyzdekedhoy` and name `create_layouts_table`:

```sql
create table layouts (
  id          uuid not null default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  version     integer not null default 1,
  status      text not null default 'draft' check (status in ('draft', 'published', 'deleted')),
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  created_by  uuid not null references auth.users(id),
  updated_at  timestamptz not null default now(),
  updated_by  uuid not null references auth.users(id),

  primary key (id, version)
);

create index layouts_user_id_idx on layouts(user_id);
create index layouts_status_idx on layouts(status);

alter table layouts enable row level security;

create policy "Published layouts visible to authenticated"
  on layouts for select
  using (auth.role() = 'authenticated' and status = 'published');

create policy "Owner can view own layouts"
  on layouts for select
  using (auth.uid() = user_id);

create policy "Owner can insert own layouts"
  on layouts for insert
  with check (auth.uid() = user_id);

create policy "Owner can update own layouts"
  on layouts for update
  using (auth.uid() = user_id);

create policy "Owner can delete own layouts"
  on layouts for delete
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Verify migration**

Use Supabase MCP `list_tables` to confirm the `layouts` table exists.

- [ ] **Step 3: Commit (no local files, just note in commit)**

No local files to commit for this task — migration is in Supabase.

---

### Task 2: Install dayjs and create formatDate utility

**Files:**

- Create: `src/lib/formatDate.ts`

- [ ] **Step 1: Install dayjs**

Run:

```bash
pnpm add dayjs
```

- [ ] **Step 2: Create formatDate.ts**

Create `src/lib/formatDate.ts`:

```ts
import dayjs from 'dayjs';

export function formatDate(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY, HH:mm');
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/formatDate.ts package.json pnpm-lock.yaml
git commit -m "feat(layout): add dayjs and formatDate utility"
```

---

### Task 3: Create TypeScript types

**Files:**

- Create: `src/lib/types.ts`

- [ ] **Step 1: Create types.ts**

Create `src/lib/types.ts`:

```ts
import type { LayoutNode } from '@/layout/types';

export type LayoutStatus = 'draft' | 'published' | 'deleted';

export type LayoutRecord = {
  id: string;
  user_id: string;
  version: number;
  status: LayoutStatus;
  data: LayoutNode;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
};
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(layout): add LayoutRecord and LayoutStatus types"
```

---

### Task 4: Create layoutApi service

**Files:**

- Create: `src/lib/layoutApi.ts`

- [ ] **Step 1: Create layoutApi.ts**

Create `src/lib/layoutApi.ts`:

```ts
import type { LayoutNode } from '@/layout/types';
import type { LayoutRecord, LayoutStatus } from '@/lib/types';
import { supabase } from '@/lib/supabase';

function getUserId(): string {
  const user = supabase.auth.getUser;
  // We rely on RLS, but need user_id for inserts
  // Caller must be authenticated
  return '';
}

async function currentUserId(): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

export async function getMyLayouts(): Promise<LayoutRecord[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('id')
    .order('version', { ascending: false });

  if (error) throw error;

  // Deduplicate: keep only latest version per id
  const seen = new Set<string>();
  const result: LayoutRecord[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.id)) {
      seen.add(row.id);
      result.push(row as LayoutRecord);
    }
  }
  return result;
}

export async function getLayout(id: string): Promise<LayoutRecord | null> {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('id', id)
    .neq('status', 'deleted')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null; // no rows
  if (error) throw error;
  return data as LayoutRecord;
}

export async function getLayoutVersion(
  id: string,
  version: number,
): Promise<LayoutRecord | null> {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('id', id)
    .eq('version', version)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as LayoutRecord;
}

export async function getPublishedLayout(
  userId: string,
): Promise<LayoutRecord | null> {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') return null;
  if (error) throw error;
  return data as LayoutRecord;
}

export async function createLayout(data: LayoutNode): Promise<LayoutRecord> {
  const userId = await currentUserId();
  const { data: row, error } = await supabase
    .from('layouts')
    .insert({
      user_id: userId,
      version: 1,
      status: 'draft' as LayoutStatus,
      data,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return row as LayoutRecord;
}

export async function saveLayout(
  id: string,
  data: LayoutNode,
): Promise<LayoutRecord> {
  const userId = await currentUserId();

  // Get current max version
  const { data: current, error: fetchError } = await supabase
    .from('layouts')
    .select('version, user_id')
    .eq('id', id)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (fetchError) throw fetchError;

  const nextVersion = (current?.version ?? 0) + 1;

  const { data: row, error } = await supabase
    .from('layouts')
    .insert({
      id,
      user_id: current.user_id,
      version: nextVersion,
      status: 'draft' as LayoutStatus,
      data,
      created_by: userId,
      updated_by: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return row as LayoutRecord;
}

export async function setStatus(
  id: string,
  version: number,
  status: LayoutStatus,
): Promise<void> {
  const userId = await currentUserId();

  // If publishing, unpublish any currently published version of this layout
  if (status === 'published') {
    await supabase
      .from('layouts')
      .update({
        status: 'draft',
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'published');
  }

  const { error } = await supabase
    .from('layouts')
    .update({
      status,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('version', version);

  if (error) throw error;
}

export async function getVersionHistory(id: string): Promise<LayoutRecord[]> {
  const { data, error } = await supabase
    .from('layouts')
    .select('*')
    .eq('id', id)
    .order('version', { ascending: false });

  if (error) throw error;
  return (data ?? []) as LayoutRecord[];
}
```

- [ ] **Step 2: Remove unused getUserId helper**

The `getUserId` function at the top is dead code from scaffolding. Remove it (lines with `function getUserId`).

Actually, let me provide the clean version. Replace the file — remove the dead `getUserId` function entirely. The `currentUserId` async function is the only helper needed.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/lib/layoutApi.ts
git commit -m "feat(layout): create layoutApi CRUD service"
```
