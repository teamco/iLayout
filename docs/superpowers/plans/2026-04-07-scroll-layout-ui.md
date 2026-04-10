# Scroll Layout UI (Plan B) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the scroll mode UI: ScrollLayout renderer, section components, drag handles, section config modal, mode selection at creation, and conditional horizontal grid.

**Architecture:** `ScrollLayout` renders `ScrollRoot` sections in a scrollable container. `SectionNodeComponent` renders individual sections with configurable height/overlap/z-index. `SectionHandle` provides drag-to-resize between sections. Mode is chosen at layout creation via Dropdown.Button (immutable after).

**Tech Stack:** React, antd (Modal, Form, Select, Dropdown.Button), Zustand store, existing grid utilities.

---

### Task 1: Create SectionNodeComponent

**Files:**

- Create: `src/layout/components/SectionNodeComponent.tsx`
- Create: `src/layout/components/SectionNode.module.less`

- [ ] **Step 1: Create SectionNode.module.less**

Create `src/layout/components/SectionNode.module.less`:

```less
@import '@/themes/mixin.module.less';

.section {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.sectionEdit {
  border: 1px dashed @color-blue;
}

.configBtn {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: @z-toolbar;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
}

.addBtn {
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
  cursor: pointer;
  color: @color-blue;
  font-size: 16px;
  &:hover {
    opacity: 1;
    background: rgba(24, 144, 255, 0.05);
  }
}
```

- [ ] **Step 2: Create SectionNodeComponent.tsx**

Create `src/layout/components/SectionNodeComponent.tsx`:

```tsx
import React from 'react';
import { Button, Tooltip } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import clsx from 'clsx';
import type { SectionNode } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { renderNode } from './LayoutRenderer';
import styles from './SectionNode.module.less';

type Props = {
  section: SectionNode;
  onConfig: (sectionId: string) => void;
};

function getSectionStyle(section: SectionNode): React.CSSProperties {
  const style: React.CSSProperties = { width: '100%', position: 'relative' };

  switch (section.height.type) {
    case 'fixed':
      style.height = section.height.value;
      break;
    case 'min':
      style.minHeight = section.height.value;
      break;
    case 'auto':
    default:
      break;
  }

  if (section.overlap) {
    style.marginTop = section.overlap;
  }
  if (section.zIndex) {
    style.zIndex = section.zIndex;
  }

  return style;
}

export function SectionNodeComponent({ section, onConfig }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);
  const addSection = useLayoutStore((s) => s.addSection);

  return (
    <>
      {editMode && (
        <div
          className={styles.addBtn}
          onClick={() => addSection('before', section.id)}
        >
          <PlusOutlined />
        </div>
      )}
      <div
        className={clsx(styles.section, { [styles.sectionEdit]: editMode })}
        style={getSectionStyle(section)}
      >
        {editMode && (
          <Tooltip title="Section config">
            <Button
              size="small"
              icon={<SettingOutlined />}
              className={styles.configBtn}
              onClick={() => onConfig(section.id)}
            />
          </Tooltip>
        )}
        {renderNode(section.child)}
      </div>
      {editMode && (
        <div
          className={styles.addBtn}
          onClick={() => addSection('after', section.id)}
        >
          <PlusOutlined />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/layout/components/SectionNodeComponent.tsx src/layout/components/SectionNode.module.less
git commit -m "feat(scroll): create SectionNodeComponent"
```

---

### Task 2: Create SectionHandle

**Files:**

- Create: `src/layout/components/SectionHandle.tsx`

- [ ] **Step 1: Create SectionHandle.tsx**

Create `src/layout/components/SectionHandle.tsx`:

```tsx
import React, { useCallback, useRef } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { useGridContext } from '@/layout/grid/GridContext';
import {
  getHorizontalGridEdges,
  snapToNearestEdge,
} from '@/layout/grid/snapToGrid';

type Props = {
  sectionId: string;
};

export function SectionHandle({ sectionId }: Props) {
  const resizeSection = useLayoutStore((s) => s.resizeSection);
  const root = useLayoutStore((s) => s.root);
  const { canvasHeight, rows, rowGutter } = useGridContext();
  const startRef = useRef<{ y: number; height: number } | null>(null);

  // Find the section to check if it's resizable
  const scrollRoot =
    root.type === 'scroll' ? (root as unknown as ScrollRoot) : null;
  const section = scrollRoot?.sections.find((s) => s.id === sectionId);
  const isDisabled = !section || section.height.type === 'auto';

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isDisabled) return;
      e.preventDefault();
      e.stopPropagation();

      const el = e.currentTarget as HTMLElement;
      const sectionEl = el.previousElementSibling as HTMLElement | null;
      if (!sectionEl) return;

      startRef.current = { y: e.clientY, height: sectionEl.offsetHeight };
      el.setPointerCapture(e.pointerId);
    },
    [isDisabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      const newHeight = Math.max(50, startRef.current.height + dy);
      resizeSection(sectionId, {
        type: 'fixed',
        value: `${Math.round(newHeight)}px`,
      });
    },
    [sectionId, resizeSection],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const dy = e.clientY - startRef.current.y;
      let newHeight = Math.max(50, startRef.current.height + dy);

      // Snap to horizontal grid
      if (canvasHeight > 0) {
        const edges = getHorizontalGridEdges(canvasHeight, rows, rowGutter);
        newHeight = snapToNearestEdge(newHeight, edges);
      }

      resizeSection(sectionId, {
        type: 'fixed',
        value: `${Math.round(newHeight)}px`,
      });
      startRef.current = null;
    },
    [sectionId, resizeSection, canvasHeight, rows, rowGutter],
  );

  return (
    <div
      style={{
        height: 6,
        cursor: isDisabled ? 'default' : 'ns-resize',
        background: isDisabled ? 'transparent' : 'var(--border-dim)',
        opacity: isDisabled ? 0.3 : 0.6,
        transition: 'opacity 0.15s',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/SectionHandle.tsx
git commit -m "feat(scroll): create SectionHandle drag-to-resize"
```

---

### Task 3: Create SectionConfig modal

**Files:**

- Create: `src/layout/components/SectionConfig.tsx`

- [ ] **Step 1: Create SectionConfig.tsx**

Create `src/layout/components/SectionConfig.tsx`:

```tsx
import { useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SectionNode, SectionHeight } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = {
  open: boolean;
  sectionId: string | null;
  onClose: () => void;
};

type FormValues = {
  heightType: 'auto' | 'fixed' | 'min';
  heightValue: number;
  heightUnit: string;
  overlap: number;
  zIndex: number;
};

function parseHeight(height: SectionHeight): {
  type: string;
  value: number;
  unit: string;
} {
  if (height.type === 'auto') return { type: 'auto', value: 0, unit: 'px' };
  const match = height.value.match(/^(-?\d+(?:\.\d+)?)\s*(px|vh|%)$/);
  if (match)
    return { type: height.type, value: Number(match[1]), unit: match[2] };
  return {
    type: height.type,
    value: parseFloat(height.value) || 0,
    unit: 'px',
  };
}

function parseOverlap(overlap?: string): number {
  if (!overlap) return 0;
  return parseFloat(overlap) || 0;
}

export function SectionConfig({ open, sectionId, onClose }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const root = useLayoutStore((s) => s.root);
  const resizeSection = useLayoutStore((s) => s.resizeSection);
  const updateSectionConfig = useLayoutStore((s) => s.updateSectionConfig);
  const removeSection = useLayoutStore((s) => s.removeSection);

  const scrollRoot = root.type === 'scroll' ? root : null;
  const section =
    scrollRoot && 'sections' in scrollRoot
      ? (scrollRoot as unknown as { sections: SectionNode[] }).sections.find(
          (s) => s.id === sectionId,
        )
      : null;

  useEffect(() => {
    if (open && section) {
      const h = parseHeight(section.height);
      form.setFieldsValue({
        heightType: h.type as 'auto' | 'fixed' | 'min',
        heightValue: h.value,
        heightUnit: h.unit,
        overlap: parseOverlap(section.overlap),
        zIndex: section.zIndex ?? 0,
      });
    }
  }, [open, section, form]);

  function handleSave() {
    if (!sectionId) return;
    const values = form.getFieldsValue();

    const height: SectionHeight =
      values.heightType === 'auto'
        ? { type: 'auto' }
        : {
            type: values.heightType,
            value: `${values.heightValue}${values.heightUnit}`,
          };

    resizeSection(sectionId, height);
    updateSectionConfig(sectionId, {
      overlap: values.overlap !== 0 ? `${values.overlap}px` : undefined,
      zIndex: values.zIndex !== 0 ? values.zIndex : undefined,
    });
    onClose();
  }

  function handleDelete() {
    if (!sectionId) return;
    removeSection(sectionId);
    onClose();
  }

  const heightType = Form.useWatch('heightType', form);

  return (
    <Modal
      title={t('layout.sectionConfig', 'Section Config')}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button danger onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSave}>
            {t('common.save')}
          </Button>
        </Space>
      }
      width={380}
      forceRender
      destroyOnHidden={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          heightType: 'auto',
          heightValue: 0,
          heightUnit: 'px',
          overlap: 0,
          zIndex: 0,
        }}
      >
        <Form.Item label={t('layout.heightType', 'Height')} name="heightType">
          <Select
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'fixed', label: 'Fixed' },
              { value: 'min', label: 'Min height' },
            ]}
          />
        </Form.Item>
        {heightType !== 'auto' && (
          <Form.Item label={t('layout.heightValue', 'Value')}>
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="heightValue" noStyle>
                <InputNumber min={0} style={{ flex: 1 }} />
              </Form.Item>
              <Form.Item name="heightUnit" noStyle>
                <Select
                  options={[
                    { value: 'px', label: 'px' },
                    { value: 'vh', label: 'vh' },
                    { value: '%', label: '%' },
                  ]}
                  style={{ width: 65 }}
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        )}
        <Form.Item label={t('layout.overlap', 'Overlap (px)')} name="overlap">
          <InputNumber style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Z-index" name="zIndex">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/SectionConfig.tsx
git commit -m "feat(scroll): create SectionConfig modal"
```

---

### Task 4: Create ScrollLayout

**Files:**

- Create: `src/layout/components/ScrollLayout.tsx`

- [ ] **Step 1: Create ScrollLayout.tsx**

Create `src/layout/components/ScrollLayout.tsx`:

```tsx
import { useState } from 'react';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { SectionNodeComponent } from './SectionNodeComponent';
import { SectionHandle } from './SectionHandle';
import { SectionConfig } from './SectionConfig';

type Props = {
  root: ScrollRoot;
};

export function ScrollLayout({ root }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);
  const [configSectionId, setConfigSectionId] = useState<string | null>(null);

  return (
    <>
      <div style={{ overflowY: 'auto', height: '100%', width: '100%' }}>
        {root.sections.map((section) => (
          <div key={section.id}>
            <SectionNodeComponent
              section={section}
              onConfig={setConfigSectionId}
            />
            {editMode && <SectionHandle sectionId={section.id} />}
          </div>
        ))}
      </div>
      <SectionConfig
        open={configSectionId !== null}
        sectionId={configSectionId}
        onClose={() => setConfigSectionId(null)}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/ScrollLayout.tsx
git commit -m "feat(scroll): create ScrollLayout component"
```

---

### Task 5: Update LayoutRenderer to switch by mode

**Files:**

- Modify: `src/layout/components/LayoutRenderer.tsx`

- [ ] **Step 1: Add scroll mode rendering**

Update `src/layout/components/LayoutRenderer.tsx`:

Add import:

```tsx
import type { ScrollRoot } from '@/layout/types';
import { ScrollLayout } from './ScrollLayout';
```

Update `LayoutRenderer` component to read `layoutMode` and switch:

```tsx
export function LayoutRenderer() {
  const root = useLayoutStore((s) => s.root);
  const layoutMode = useLayoutStore((s) => s.layoutMode);

  return (
    <LayoutDndContext>
      <div className={styles.root}>
        {layoutMode === 'scroll' && root.type === 'scroll' ? (
          <ScrollLayout root={root as unknown as ScrollRoot} />
        ) : (
          renderNode(root)
        )}
      </div>
    </LayoutDndContext>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/layout/components/LayoutRenderer.tsx
git commit -m "feat(scroll): update LayoutRenderer to switch by mode"
```

---

### Task 6: Conditional horizontal grid + scrollable canvas

**Files:**

- Modify: `src/layout/components/GridOverlay.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Conditional horizontal grid**

In `src/layout/components/GridOverlay.tsx`, add:

```tsx
import { useLayoutStore } from '@/layout/store/layoutStore';
```

Inside the component, read mode:

```tsx
const layoutMode = useLayoutStore((s) => s.layoutMode);
```

Conditionally render the horizontal row pattern — only when `layoutMode === 'scroll'`:

Change the second `<rect>` (row fill) to:

```tsx
{
  layoutMode === 'scroll' && (
    <rect
      width={canvasWidth}
      height={canvasHeight}
      fill={`url(#${rowPatternId})`}
    />
  );
}
```

Also conditionally define the row pattern (skip computation when viewport):

```tsx
{layoutMode === 'scroll' && (
  <pattern ...>
    <rect ... />
  </pattern>
)}
```

- [ ] **Step 2: Scrollable canvas in scroll mode**

In `src/App.tsx`, read `layoutMode` from store:

```tsx
const layoutMode = useLayoutStore((s) => s.layoutMode);
```

Update the canvas div to conditionally allow scroll:

```tsx
<div className={styles.canvas} style={layoutMode === 'scroll' ? { overflowY: 'auto' } : undefined}>
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/layout/components/GridOverlay.tsx src/App.tsx
git commit -m "feat(scroll): conditional horizontal grid + scrollable canvas"
```

---

### Task 7: Mode selection at layout creation

**Files:**

- Modify: `src/pages/profile/LayoutsSection.tsx`
- Modify: `src/pages/HomePage.tsx`
- Modify: `src/pages/LayoutEditorPage.tsx`

- [ ] **Step 1: Replace "New Layout" button with Dropdown.Button in LayoutsSection**

In `src/pages/profile/LayoutsSection.tsx`:

Add import:

```tsx
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
```

Replace the "New Layout" `<Button>` with:

```tsx
<Can I={EAction.CREATE} a={ESubject.LAYOUT}>
  <Dropdown.Button
    type="primary"
    icon={<PlusOutlined />}
    menu={{
      items: [
        { key: 'viewport', label: 'Viewport' },
        { key: 'scroll', label: 'Scroll' },
      ],
      onClick: ({ key }) =>
        void navigate({
          to: ERoutes.LAYOUT_NEW as string,
          search: { mode: key },
        }),
    }}
    onClick={() =>
      void navigate({
        to: ERoutes.LAYOUT_NEW as string,
        search: { mode: 'viewport' },
      })
    }
  >
    {t('layout.newLayout')}
  </Dropdown.Button>
</Can>
```

- [ ] **Step 2: Same pattern in HomePage**

In `src/pages/HomePage.tsx`, replace the "Create New Layout" button with similar Dropdown.Button:

```tsx
{
  user && (
    <Dropdown.Button
      type="primary"
      menu={{
        items: [
          { key: 'viewport', label: 'Viewport' },
          { key: 'scroll', label: 'Scroll' },
        ],
        onClick: ({ key }) =>
          void navigate({
            to: ERoutes.LAYOUT_NEW as string,
            search: { mode: key },
          }),
      }}
      onClick={() =>
        void navigate({
          to: ERoutes.LAYOUT_NEW as string,
          search: { mode: 'viewport' },
        })
      }
    >
      {t('home.createNewLayout')}
    </Dropdown.Button>
  );
}
```

- [ ] **Step 3: Read mode from URL in LayoutEditorPage**

In `src/pages/LayoutEditorPage.tsx`:

Read mode from search params (TanStack Router `useSearch` or `window.location.search`):

```tsx
const searchParams = new URLSearchParams(window.location.search);
const mode = (searchParams.get('mode') as 'viewport' | 'scroll') || 'viewport';
```

In the `isNew` reset effect, set the layout mode:

```tsx
useEffect(() => {
  if (isNew) {
    const searchParams = new URLSearchParams(window.location.search);
    const mode =
      (searchParams.get('mode') as 'viewport' | 'scroll') || 'viewport';
    useLayoutStore.getState().setLayoutMode(mode);
    if (mode === 'scroll') {
      // setLayoutMode already creates ScrollRoot, no extra setState needed
    } else {
      useLayoutStore.setState({
        root: { id: crypto.randomUUID(), type: 'leaf' },
      });
    }
    useLayoutStore.getState().setEditMode(true);
  }
}, [isNew]);
```

In the `handleSave` create mutation, include mode:

```tsx
createMutation.mutate({ ...root_payload, mode }, { ... });
```

Note: The `createLayout` in `layoutApi.ts` may need to accept a `mode` parameter. Check and update if needed.

- [ ] **Step 4: Verify build**

Run: `pnpm build`

- [ ] **Step 5: Commit**

```bash
git add src/pages/profile/LayoutsSection.tsx src/pages/HomePage.tsx src/pages/LayoutEditorPage.tsx
git commit -m "feat(scroll): mode selection at layout creation via Dropdown.Button"
```

---

### Task 8: Add i18n translations for scroll mode

**Files:**

- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ru.json`
- Modify: `src/i18n/locales/he.json`

- [ ] **Step 1: Add translations**

Add to `layout` section in each locale:

**en.json:**

```json
"sectionConfig": "Section Config",
"heightType": "Height",
"heightValue": "Value",
"overlap": "Overlap (px)",
"addSection": "Add section"
```

**ru.json:**

```json
"sectionConfig": "Настройки секции",
"heightType": "Высота",
"heightValue": "Значение",
"overlap": "Перекрытие (px)",
"addSection": "Добавить секцию"
```

**he.json:**

```json
"sectionConfig": "הגדרות מקטע",
"heightType": "גובה",
"heightValue": "ערך",
"overlap": "חפיפה (px)",
"addSection": "הוסף מקטע"
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(scroll): add i18n translations for scroll mode"
```
