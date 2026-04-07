# Layout Database Schema + API Design

## Overview

Supabase database table for persisting layouts with versioning (each save = new row), status management (draft/published/deleted with soft delete), and RLS policies (published visible to all authenticated, everything else owner-only). A thin TypeScript API service wraps Supabase client queries. dayjs used for date formatting.

## Database Schema

### Table: `layouts`

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
```

- `id` — layout identifier, same across all versions of one layout
- `version` — increments on each save (new row per save)
- `status` — `draft` (editing), `published` (live), `deleted` (soft delete)
- `data` — JSON layout tree (`LayoutNode`)
- `user_id` — owner
- `created_by` / `updated_by` — who created/updated this version
- Composite PK: `(id, version)`

### Versioning logic

- New layout: `INSERT` with `version = 1`
- Update: `INSERT` new row with `version = max(version for this id) + 1`, same `id` and `user_id`
- Only one version per `id` can be `published` — enforced in application logic (publishing sets previous published version to `draft`)

### RLS Policies

```sql
alter table layouts enable row level security;

-- All authenticated users can see published layouts
create policy "Published layouts visible to authenticated"
  on layouts for select
  using (auth.role() = 'authenticated' and status = 'published');

-- Owner sees all own layouts (any status)
create policy "Owner can view own layouts"
  on layouts for select
  using (auth.uid() = user_id);

-- Owner can insert own layouts
create policy "Owner can insert own layouts"
  on layouts for insert
  with check (auth.uid() = user_id);

-- Owner can update own layouts
create policy "Owner can update own layouts"
  on layouts for update
  using (auth.uid() = user_id);

-- Owner can delete own layouts (hard delete if needed later)
create policy "Owner can delete own layouts"
  on layouts for delete
  using (auth.uid() = user_id);
```

## TypeScript Types

**Location:** `src/lib/types.ts`

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

Dates are ISO 8601 strings as returned by Supabase. Formatted with dayjs at display time.

## Layout API Service

**Location:** `src/lib/layoutApi.ts`

```ts
// Get user's layouts (latest version per id)
getMyLayouts(): Promise<LayoutRecord[]>

// Get specific layout (latest version)
getLayout(id: string): Promise<LayoutRecord | null>

// Get specific version
getLayoutVersion(id: string, version: number): Promise<LayoutRecord | null>

// Get published layout for a user
getPublishedLayout(userId: string): Promise<LayoutRecord | null>

// Create new layout (version 1, status draft)
createLayout(data: LayoutNode): Promise<LayoutRecord>

// Save new version (version + 1, status draft)
saveLayout(id: string, data: LayoutNode): Promise<LayoutRecord>

// Change status (publish, soft delete, restore to draft)
setStatus(id: string, version: number, status: LayoutStatus): Promise<void>

// Get version history for a layout
getVersionHistory(id: string): Promise<LayoutRecord[]>
```

### `getMyLayouts` implementation note

Returns latest version per layout id. Uses a subquery or `distinct on`:
```sql
select distinct on (id) * from layouts
where user_id = auth.uid() and status != 'deleted'
order by id, version desc;
```

### `setStatus` publish logic

When setting status to `published`:
1. Find any existing row with same `id` and `status = 'published'`
2. Update that row to `status = 'draft'`
3. Update target row to `status = 'published'`

## Date Formatting

**Location:** `src/lib/formatDate.ts`

```ts
import dayjs from 'dayjs';

export function formatDate(iso: string): string {
  return dayjs(iso).format('DD MMM YYYY, HH:mm');
}
```

## File Structure

```
src/lib/
  types.ts              # LayoutRecord, LayoutStatus
  layoutApi.ts          # Supabase CRUD service
  formatDate.ts         # dayjs formatting utility
```

New dependency: `dayjs`

Migration applied via Supabase MCP `apply_migration`.
