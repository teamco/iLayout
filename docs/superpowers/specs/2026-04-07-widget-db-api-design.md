# Widget DB Schema + API Design

## Overview

Supabase database table for persisting widgets with categories, resource types, content, config (CSS + behavior), tags, and public/private visibility. Widgets are per-user with publish capability — published + public widgets visible to all authenticated users in the gallery.

## Database Schema

### Table: `widgets`

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
```

### RLS Policies

```sql
alter table widgets enable row level security;

-- Owner sees all own widgets (any status)
create policy "Owner can view own widgets"
  on widgets for select
  using (auth.uid() = user_id);

-- All authenticated see public + published widgets
create policy "Public published widgets visible to authenticated"
  on widgets for select
  using (auth.role() = 'authenticated' and is_public = true and status = 'published');

-- Owner can insert/update/delete own widgets
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

## TypeScript Types

**Location:** `src/lib/types.ts`

### Enums

```ts
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
```

### Widget types

```ts
export type WidgetContent = {
  value: string;
};

export type WidgetConfig = {
  isEditable: boolean;
  isClonable: boolean;
  css?: WidgetBounds;
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

`WidgetConfig.css` uses existing `WidgetBounds` type (margins, align) — same as layout widget config. Reuses `IEntityMeta` for created/updated at/by. Reuses `LayoutStatus` (draft/published/deleted).

## Widget API

**Location:** `src/lib/queries/widgetApi.ts`

```ts
// Get user's own widgets (latest, excluding deleted)
getWidgets(userId: IUser['id']): Promise<WidgetRecord[]>

// Get all public + published widgets (gallery)
getPublicWidgets(): Promise<WidgetRecord[]>

// Get single widget by id
getWidget(id: string): Promise<WidgetRecord | null>

// Create new widget (status draft)
createWidget(data: Partial<WidgetRecord>): Promise<WidgetRecord>

// Update widget fields
updateWidget(id: string, data: Partial<WidgetRecord>): Promise<WidgetRecord>

// Soft delete (set status = 'deleted')
deleteWidget(id: string): Promise<void>
```

## Query Hooks

**Location:** `src/lib/hooks/useWidgetQueries.ts`

```ts
useWidgets(userId)           // own widgets
usePublicWidgets()           // public + published for gallery
useWidget(id)                // single widget
useCreateWidget()            // mutation
useUpdateWidget()            // mutation
useDeleteWidget()            // mutation (soft delete)
```

Cache invalidation: mutations invalidate `['widgets']` prefix.

## File Structure

```
src/lib/
  types.ts                          # Add enums + WidgetRecord
  queries/widgetApi.ts              # CRUD service
  hooks/useWidgetQueries.ts         # TanStack Query hooks
```

Migration applied via Supabase MCP.
