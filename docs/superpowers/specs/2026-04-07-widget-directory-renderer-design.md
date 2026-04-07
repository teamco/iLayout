# Widget Directory + Renderer + Gallery Design

## Overview

Create a modular widget directory structure where each widget type (youtube, image, empty, etc.) lives in its own folder with a component, optional editor, and definition metadata. Update WidgetRenderer to use the new registry. Update Gallery to show both built-in widgets and user-published widgets from Supabase.

## Widget Directory Structure

```
src/widgets/
  types.ts                       # WidgetDefinition type
  registry.ts                    # registerWidget, getWidgetDef, getAllWidgetDefs
  empty/
    index.ts                     # re-export
    EmptyWidget.tsx              # placeholder renderer
    definition.ts                # metadata
  youtube/
    index.ts
    YouTubeWidget.tsx            # iframe embed renderer
    YouTubeEditor.tsx            # URL input + preview
    definition.ts
  image/
    index.ts
    ImageWidget.tsx              # img tag renderer
    ImageEditor.tsx              # URL input + preview
    definition.ts
```

## WidgetDefinition Type

**Location:** `src/widgets/types.ts`

```ts
import type { ComponentType } from 'react';
import type { EWidgetResource, WidgetContent, WidgetConfig } from '@/lib/types';

export type WidgetComponentProps = {
  content: WidgetContent;
  config: WidgetConfig;
};

export type WidgetEditorProps = {
  content: WidgetContent;
  onChange: (content: WidgetContent) => void;
};

export type WidgetDefinition = {
  resource: EWidgetResource;
  label: string;
  description: string;
  icon: ComponentType;
  component: ComponentType<WidgetComponentProps>;
  editor?: ComponentType<WidgetEditorProps>;
  defaultContent: WidgetContent;
  defaultConfig: Partial<WidgetConfig>;
};
```

## Registry

**Location:** `src/widgets/registry.ts`

```ts
Map<EWidgetResource, WidgetDefinition>
```

- `registerWidget(def)` — adds to map
- `getWidgetDef(resource)` — returns definition or undefined
- `getAllWidgetDefs()` — returns all definitions (for gallery)

All widget modules auto-register via side-effect imports at the bottom of registry.ts:
```ts
import './empty';
import './youtube';
import './image';
```

## Built-in Widgets

### Empty (`src/widgets/empty/`)
- **Component:** renders "Empty" placeholder text
- **No editor** — content is static
- **Default content:** `{ value: '' }`
- **Icon:** `BorderOutlined`

### YouTube (`src/widgets/youtube/`)
- **Component:** renders YouTube embed iframe from `content.value` (URL → embed URL conversion)
- **Editor:** Input for YouTube URL + live iframe preview below
- **Default content:** `{ value: '' }`
- **Icon:** `YoutubeOutlined`
- **URL conversion:** `https://www.youtube.com/watch?v=ID` → `https://www.youtube.com/embed/ID`

### Image (`src/widgets/image/`)
- **Component:** renders `<img>` from `content.value` (URL), fills container
- **Editor:** Input for image URL + preview below
- **Default content:** `{ value: '' }`
- **Icon:** `PictureOutlined`

## WidgetRenderer Update

**Location:** `src/layout/widgets/WidgetRenderer.tsx`

Currently renders based on `widget.type` (iframe/component). Change to:

1. Read `widget` which now references a `WidgetRecord` or contains `resource` field
2. Look up `getWidgetDef(resource)` from registry
3. If found, render `<def.component content={content} config={config} />`
4. If not found, render fallback (widget name or "Unknown widget")
5. Keep existing margin/inset CSS logic

The existing `WidgetRef` type in layout/types.ts needs updating — `type` field should map to `EWidgetResource`, and `config` should include widget content reference.

## Gallery Update

**Location:** `src/layout/widgets/WidgetGallery.tsx`

Currently shows widgets from the old `widgetRegistry`. Update to:

1. **Built-in section:** Show all `getAllWidgetDefs()` from new registry as draggable cards
2. **Community section:** Show `usePublicWidgets()` from Supabase as additional cards
3. When user selects a widget, create a `WidgetRef` with the appropriate `resource` and default content

## WidgetEditorPage Content Tab Update

**Location:** `src/pages/WidgetEditorPage.tsx`

In the Content tab:
1. Read current `resource` value from form
2. Look up `getWidgetDef(resource)` — if it has an `editor`, render it instead of plain TextArea
3. Editor receives `content` and `onChange` — syncs back to form state

## Migration: Remove Old Registry

- Delete `src/layout/widgets/widgetRegistry.ts`
- Update all imports that reference it

## File Structure

New files:
```
src/widgets/types.ts
src/widgets/registry.ts
src/widgets/empty/index.ts
src/widgets/empty/EmptyWidget.tsx
src/widgets/empty/definition.ts
src/widgets/youtube/index.ts
src/widgets/youtube/YouTubeWidget.tsx
src/widgets/youtube/YouTubeEditor.tsx
src/widgets/youtube/definition.ts
src/widgets/image/index.ts
src/widgets/image/ImageWidget.tsx
src/widgets/image/ImageEditor.tsx
src/widgets/image/definition.ts
```

Modified files:
- `src/layout/widgets/WidgetRenderer.tsx`
- `src/layout/widgets/WidgetGallery.tsx`
- `src/pages/WidgetEditorPage.tsx`

Deleted files:
- `src/layout/widgets/widgetRegistry.ts`
