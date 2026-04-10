# Widget Directory + Renderer + Gallery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create modular widget directory (`src/widgets/`) with typed definitions, built-in widgets (empty, youtube, image), update WidgetRenderer and Gallery to use the new registry.

**Architecture:** Each widget type lives in its own folder with component, optional editor, and definition. A central registry auto-discovers all widgets via side-effect imports. WidgetRenderer looks up the registry by `resource` field. Gallery shows both built-in and Supabase public widgets.

**Tech Stack:** React components, antd, existing WidgetContent/WidgetConfig types from lib/types.ts.

---

### Task 1: Create widget types and registry

**Files:**

- Create: `src/widgets/types.ts`
- Create: `src/widgets/registry.ts`

- [ ] **Step 1: Create types.ts**

Create `src/widgets/types.ts`:

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

- [ ] **Step 2: Create registry.ts**

Create `src/widgets/registry.ts`:

```ts
import type { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from './types';

const registry = new Map<EWidgetResource, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.resource, def);
}

export function getWidgetDef(
  resource: EWidgetResource,
): WidgetDefinition | undefined {
  return registry.get(resource);
}

export function getAllWidgetDefs(): WidgetDefinition[] {
  return Array.from(registry.values());
}

// Auto-register built-in widgets
import './empty';
import './youtube';
import './image';
```

- [ ] **Step 3: Verify build (will fail — widget modules don't exist yet, that's OK)**

This step just creates the files. Build will succeed after Tasks 2-4.

- [ ] **Step 4: Commit**

```bash
git add src/widgets/types.ts src/widgets/registry.ts
git commit -m "feat(widgets): create widget types and registry"
```

---

### Task 2: Create Empty widget

**Files:**

- Create: `src/widgets/empty/definition.ts`
- Create: `src/widgets/empty/EmptyWidget.tsx`
- Create: `src/widgets/empty/index.ts`

- [ ] **Step 1: Create definition.ts**

Create `src/widgets/empty/definition.ts`:

```ts
import { BorderOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { EmptyWidget } from './EmptyWidget';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.EMPTY,
  label: 'Empty',
  description: 'Empty placeholder widget',
  icon: BorderOutlined,
  component: EmptyWidget,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
```

- [ ] **Step 2: Create EmptyWidget.tsx**

Create `src/widgets/empty/EmptyWidget.tsx`:

```tsx
import type { WidgetComponentProps } from '../types';

export function EmptyWidget({ content }: WidgetComponentProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-muted)',
        fontSize: 12,
      }}
    >
      {content.value || 'Empty'}
    </div>
  );
}
```

- [ ] **Step 3: Create index.ts**

Create `src/widgets/empty/index.ts`:

```ts
import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { EmptyWidget } from './EmptyWidget';
```

- [ ] **Step 4: Commit**

```bash
git add src/widgets/empty/
git commit -m "feat(widgets): create Empty widget"
```

---

### Task 3: Create YouTube widget

**Files:**

- Create: `src/widgets/youtube/definition.ts`
- Create: `src/widgets/youtube/YouTubeWidget.tsx`
- Create: `src/widgets/youtube/YouTubeEditor.tsx`
- Create: `src/widgets/youtube/index.ts`

- [ ] **Step 1: Create definition.ts**

Create `src/widgets/youtube/definition.ts`:

```ts
import { YoutubeOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { YouTubeWidget } from './YouTubeWidget';
import { YouTubeEditor } from './YouTubeEditor';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.YOUTUBE,
  label: 'YouTube',
  description: 'Embed a YouTube video',
  icon: YoutubeOutlined,
  component: YouTubeWidget,
  editor: YouTubeEditor,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
```

- [ ] **Step 2: Create YouTubeWidget.tsx**

Create `src/widgets/youtube/YouTubeWidget.tsx`:

```tsx
import type { WidgetComponentProps } from '../types';

function toEmbedUrl(url: string): string {
  if (!url) return '';
  // Already an embed URL
  if (url.includes('/embed/')) return url;
  // youtube.com/watch?v=ID
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

export function YouTubeWidget({ content }: WidgetComponentProps) {
  const embedUrl = toEmbedUrl(content.value);

  if (!embedUrl) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-muted)',
          fontSize: 12,
        }}
      >
        No YouTube URL
      </div>
    );
  }

  return (
    <iframe
      src={embedUrl}
      style={{ width: '100%', height: '100%', border: 'none' }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube video"
    />
  );
}
```

- [ ] **Step 3: Create YouTubeEditor.tsx**

Create `src/widgets/youtube/YouTubeEditor.tsx`:

```tsx
import { Input, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { WidgetEditorProps } from '../types';

export function YouTubeEditor({ content, onChange }: WidgetEditorProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Input
        placeholder="https://www.youtube.com/watch?v=..."
        value={content.value}
        onChange={(e) => onChange({ ...content, value: e.target.value })}
      />
      {content.value && (
        <div style={{ marginTop: 12, aspectRatio: '16/9', maxHeight: 300 }}>
          <iframe
            src={
              content.value.includes('/embed/')
                ? content.value
                : `https://www.youtube.com/embed/${content.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)?.[1] ?? ''}`
            }
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube preview"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create index.ts**

Create `src/widgets/youtube/index.ts`:

```ts
import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { YouTubeWidget } from './YouTubeWidget';
export { YouTubeEditor } from './YouTubeEditor';
```

- [ ] **Step 5: Commit**

```bash
git add src/widgets/youtube/
git commit -m "feat(widgets): create YouTube widget with editor"
```

---

### Task 4: Create Image widget

**Files:**

- Create: `src/widgets/image/definition.ts`
- Create: `src/widgets/image/ImageWidget.tsx`
- Create: `src/widgets/image/ImageEditor.tsx`
- Create: `src/widgets/image/index.ts`

- [ ] **Step 1: Create definition.ts**

Create `src/widgets/image/definition.ts`:

```ts
import { PictureOutlined } from '@ant-design/icons';
import { EWidgetResource } from '@/lib/types';
import type { WidgetDefinition } from '../types';
import { ImageWidget } from './ImageWidget';
import { ImageEditor } from './ImageEditor';

export const definition: WidgetDefinition = {
  resource: EWidgetResource.IMAGE,
  label: 'Image',
  description: 'Display an image from URL',
  icon: PictureOutlined,
  component: ImageWidget,
  editor: ImageEditor,
  defaultContent: { value: '' },
  defaultConfig: { isEditable: false, isClonable: true },
};
```

- [ ] **Step 2: Create ImageWidget.tsx**

Create `src/widgets/image/ImageWidget.tsx`:

```tsx
import type { WidgetComponentProps } from '../types';

export function ImageWidget({ content }: WidgetComponentProps) {
  if (!content.value) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-muted)',
          fontSize: 12,
        }}
      >
        No image URL
      </div>
    );
  }

  return (
    <img
      src={content.value}
      alt="Widget"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
```

- [ ] **Step 3: Create ImageEditor.tsx**

Create `src/widgets/image/ImageEditor.tsx`:

```tsx
import { Input } from 'antd';
import type { WidgetEditorProps } from '../types';

export function ImageEditor({ content, onChange }: WidgetEditorProps) {
  return (
    <div>
      <Input
        placeholder="https://example.com/image.png"
        value={content.value}
        onChange={(e) => onChange({ ...content, value: e.target.value })}
      />
      {content.value && (
        <div style={{ marginTop: 12, maxHeight: 300, textAlign: 'center' }}>
          <img
            src={content.value}
            alt="Preview"
            style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create index.ts**

Create `src/widgets/image/index.ts`:

```ts
import { registerWidget } from '../registry';
import { definition } from './definition';

registerWidget(definition);

export { definition };
export { ImageWidget } from './ImageWidget';
export { ImageEditor } from './ImageEditor';
```

- [ ] **Step 5: Verify build**

Run: `pnpm build`
Expected: Build succeeds (registry imports all 3 widgets).

- [ ] **Step 6: Commit**

```bash
git add src/widgets/image/
git commit -m "feat(widgets): create Image widget with editor"
```

---

### Task 5: Update WidgetRef type and WidgetRenderer

**Files:**

- Modify: `src/layout/types.ts`
- Modify: `src/layout/widgets/WidgetRenderer.tsx`

- [ ] **Step 1: Update WidgetRef in layout/types.ts**

Update `WidgetRef` to use `resource` instead of `type`:

```ts
export type WidgetRef = {
  widgetId: string;
  resource: import('@/lib/types').EWidgetResource;
  content: import('@/lib/types').WidgetContent;
  config: Record<string, unknown>;
  bounds?: WidgetBounds;
};
```

Remove the old `type: 'iframe' | 'component' | 'embed'` field.

- [ ] **Step 2: Rewrite WidgetRenderer**

Replace `src/layout/widgets/WidgetRenderer.tsx`:

```tsx
// src/layout/widgets/WidgetRenderer.tsx
import React from 'react';
import clsx from 'clsx';
import type { WidgetRef } from '@/layout/types';
import type { EWidgetResource } from '@/lib/types';
import { getWidgetDef } from '@/widgets/registry';
import { useDragActive } from '@/layout/dnd/DragActiveContext';
import styles from './WidgetRenderer.module.less';

type Props = { widget: WidgetRef };

const ALIGN_CLASS: Record<string, string> = {
  'top-left': styles.alignTopLeft,
  'top-center': styles.alignTopCenter,
  'top-right': styles.alignTopRight,
  'center-left': styles.alignCenterLeft,
  center: styles.alignCenter,
  'center-right': styles.alignCenterRight,
  'bottom-left': styles.alignBottomLeft,
  'bottom-center': styles.alignBottomCenter,
  'bottom-right': styles.alignBottomRight,
};

export function WidgetRenderer({ widget }: Props) {
  const def = getWidgetDef(widget.resource as EWidgetResource);
  const isDragActive = useDragActive();
  const { bounds } = widget;

  const alignClass =
    ALIGN_CLASS[bounds?.align ?? 'top-left'] ?? styles.alignTopLeft;

  const mt = bounds?.marginTop;
  const mr = bounds?.marginRight;
  const mb = bounds?.marginBottom;
  const ml = bounds?.marginLeft;
  const hasMargins = mt || mr || mb || ml;

  const containerStyle: React.CSSProperties = hasMargins
    ? {
        inset: `${mt ?? 0} ${mr ?? 0} ${mb ?? 0} ${ml ?? 0}`,
      }
    : {};

  let content: React.ReactNode;

  if (def) {
    const Comp = def.component;
    content = (
      <Comp
        content={widget.content ?? { value: '' }}
        config={{ isEditable: false, isClonable: true, ...widget.config }}
      />
    );
  } else {
    content = (
      <div
        className={clsx(styles.fallback, { [styles.dragActive]: isDragActive })}
      >
        {widget.widgetId}
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, alignClass)} style={containerStyle}>
      {content}
    </div>
  );
}
```

- [ ] **Step 3: Fix any type errors in other files that reference old WidgetRef.type**

Files that may need updating:

- `src/layout/components/LeafNode.tsx` — check for `widget.type === 'iframe'`
- `src/layout/widgets/WidgetGallery.tsx` — will be updated in Task 6
- `src/layout/components/LayoutJsonModal.tsx` — no changes needed (just JSON display)

In `LeafNode.tsx`, find the iframe URL input section and update to check `widget.resource === 'iframe'` instead of `widget.type === 'iframe'`.

- [ ] **Step 4: Verify build**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/layout/types.ts src/layout/widgets/WidgetRenderer.tsx src/layout/components/LeafNode.tsx
git commit -m "feat(widgets): update WidgetRef and WidgetRenderer to use registry"
```

---

### Task 6: Update WidgetGallery and remove old registry

**Files:**

- Modify: `src/layout/widgets/WidgetGallery.tsx`
- Delete: `src/layout/widgets/widgetRegistry.ts`

- [ ] **Step 1: Rewrite WidgetGallery**

Replace `src/layout/widgets/WidgetGallery.tsx`:

```tsx
// src/layout/widgets/WidgetGallery.tsx
import clsx from 'clsx';
import { Drawer, Card, Typography, Divider } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { getAllWidgetDefs } from '@/widgets/registry';
import type { WidgetDefinition } from '@/widgets/types';
import type { WidgetRef } from '@/layout/types';
import type { EWidgetResource } from '@/lib/types';
import styles from './WidgetGallery.module.less';

type Props = {
  open: boolean;
  onSelect: (widget: WidgetRef) => void;
  onClose: () => void;
};

function defToWidgetRef(def: WidgetDefinition): WidgetRef {
  return {
    widgetId: def.label,
    resource: def.resource as EWidgetResource,
    content: def.defaultContent,
    config: def.defaultConfig as Record<string, unknown>,
  };
}

function DraggableWidgetCard({
  def,
  onSelect,
}: {
  def: WidgetDefinition;
  onSelect: (w: WidgetRef) => void;
}) {
  const widgetRef = defToWidgetRef(def);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gallery-${def.resource}`,
    data: { type: 'gallery', widgetRef },
  });

  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(styles.cardWrapper, { [styles.dragging]: isDragging })}
    >
      <Card size="small" hoverable onClick={() => onSelect(widgetRef)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon />
          <div>
            <Typography.Text strong>{def.label}</Typography.Text>
            {def.description && (
              <Typography.Text
                type="secondary"
                className={styles.cardDescription}
              >
                {def.description}
              </Typography.Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function WidgetGallery({ open, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const builtIn = getAllWidgetDefs();

  return (
    <Drawer
      title={t('profile.widgets')}
      open={open}
      onClose={onClose}
      size="default"
    >
      <div className={styles.list}>
        {builtIn.map((def) => (
          <DraggableWidgetCard
            key={def.resource}
            def={def}
            onSelect={onSelect}
          />
        ))}
      </div>
    </Drawer>
  );
}
```

- [ ] **Step 2: Delete old widgetRegistry**

Delete `src/layout/widgets/widgetRegistry.ts`.

- [ ] **Step 3: Remove any remaining imports of old registry**

Search for `from './widgetRegistry'` or `from '@/layout/widgets/widgetRegistry'` and remove them. WidgetRenderer was already updated in Task 5.

- [ ] **Step 4: Verify build and tests**

Run: `pnpm build && pnpm test`

- [ ] **Step 5: Commit**

```bash
git add src/layout/widgets/WidgetGallery.tsx
git rm src/layout/widgets/widgetRegistry.ts
git commit -m "feat(widgets): update Gallery to use new registry, remove old widgetRegistry"
```

---

### Task 7: Update WidgetEditorPage Content tab with custom editors

**Files:**

- Modify: `src/pages/WidgetEditorPage.tsx`

- [ ] **Step 1: Add custom editor support in Content tab**

In `src/pages/WidgetEditorPage.tsx`:

Add import:

```tsx
import { getWidgetDef } from '@/widgets/registry';
import type { EWidgetResource } from '@/lib/types';
```

In the Content tab children, replace the static TextArea with dynamic editor:

```tsx
{
  key: 'content',
  label: t('widget.tabContent'),
  children: (() => {
    const resource = Form.useWatch('resource', form);
    const def = resource ? getWidgetDef(resource as EWidgetResource) : undefined;
    const Editor = def?.editor;

    if (Editor) {
      return (
        <>
          <Form.Item label={t('widget.contentValue')} name="contentValue">
            <Editor
              content={{ value: form.getFieldValue('contentValue') ?? '' }}
              onChange={(c) => form.setFieldValue('contentValue', c.value)}
            />
          </Form.Item>
          <Form.Item label={t('widget.thumbnail')} name="thumbnail">
            <Input />
          </Form.Item>
        </>
      );
    }

    return (
      <>
        <Form.Item label={t('widget.contentValue')} name="contentValue" extra={t('widget.contentHelp')}>
          <TextArea rows={6} />
        </Form.Item>
        <Form.Item label={t('widget.thumbnail')} name="thumbnail">
          <Input />
        </Form.Item>
      </>
    );
  })(),
}
```

Note: `Form.useWatch` requires the component to be a child of the Form. Since Tabs items render as children of Form, this works.

Actually, a cleaner approach is to extract the Content tab into a separate component:

Create a `ContentTab` component inside the file:

```tsx
function ContentTab({ form }: { form: ReturnType<typeof Form.useForm>[0] }) {
  const { t } = useTranslation();
  const resource = Form.useWatch('resource', form);
  const def = resource ? getWidgetDef(resource as EWidgetResource) : undefined;
  const Editor = def?.editor;

  return (
    <>
      {Editor ? (
        <Form.Item label={t('widget.contentValue')}>
          <ContentEditorWrapper form={form} Editor={Editor} />
        </Form.Item>
      ) : (
        <Form.Item
          label={t('widget.contentValue')}
          name="contentValue"
          extra={t('widget.contentHelp')}
        >
          <TextArea rows={6} />
        </Form.Item>
      )}
      <Form.Item label={t('widget.thumbnail')} name="thumbnail">
        <Input />
      </Form.Item>
    </>
  );
}

function ContentEditorWrapper({
  form,
  Editor,
}: {
  form: any;
  Editor: ComponentType<WidgetEditorProps>;
}) {
  const value = Form.useWatch('contentValue', form) ?? '';
  return (
    <Editor
      content={{ value }}
      onChange={(c) => form.setFieldValue('contentValue', c.value)}
    />
  );
}
```

Then use `<ContentTab form={form} />` in the Tabs items.

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/WidgetEditorPage.tsx
git commit -m "feat(widgets): add custom editors to WidgetEditorPage Content tab"
```
