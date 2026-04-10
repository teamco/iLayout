# Widget Table + Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the widgets placeholder with a CRUD table in `/profile/widgets` and add a widget editor page at `/widgets/new` and `/widgets/:widgetId/edit`.

**Architecture:** WidgetsSection follows the exact LayoutsSection pattern (useTable, useColumnsToggle, GridToolbar, widgetColumns). WidgetEditorPage is a full-screen form with Tabs (General, Content, Config, Settings). CASL gets a new WIDGET subject with same rules as LAYOUT.

**Tech Stack:** antd Table/Form/Tabs, TanStack Query hooks, CASL, TanStack Router.

---

### Task 1: Add WIDGET subject to CASL abilities

**Files:**

- Modify: `src/auth/abilities.ts`

- [ ] **Step 1: Add WIDGET to ESubject and abilities**

In `src/auth/abilities.ts`:

Add `WIDGET: 'widget'` to `ESubject`:

```ts
export const ESubject = {
  LOGIN: 'login',
  LAYOUT: 'layout',
  WIDGET: 'widget',
  ALL: 'all',
} as const;
```

Add `WidgetSubject` type next to `LayoutSubject`:

```ts
export type WidgetSubject = { kind: 'widget'; user_id: IUser['id'] };
```

Update `AppAbility` to include it:

```ts
export type AppAbility = MongoAbility<
  [EAction, LayoutSubject | WidgetSubject | ESubject | string]
>;
```

Add widget abilities for editor role (after existing layout abilities):

```ts
can(EAction.VIEW, ESubject.WIDGET);
can(EAction.CREATE, ESubject.WIDGET);
can(EAction.EDIT, ESubject.WIDGET, { user_id: { $eq: user.id } });
can(EAction.DELETE, ESubject.WIDGET, { user_id: { $eq: user.id } });
can(EAction.PUBLISH, ESubject.WIDGET, { user_id: { $eq: user.id } });
```

And for viewer:

```ts
can(EAction.VIEW, ESubject.WIDGET);
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/auth/abilities.ts
git commit -m "feat(widget): add WIDGET subject to CASL abilities"
```

---

### Task 2: Add routes

**Files:**

- Modify: `src/routes.ts`
- Modify: `src/router.tsx`

- [ ] **Step 1: Add route constants**

In `src/routes.ts`, add after `LAYOUT_EDIT`:

```ts
  WIDGET_NEW: '/widgets/new',
  WIDGET_EDIT: '/widgets/$widgetId/edit',
```

- [ ] **Step 2: Add routes to router**

In `src/router.tsx`:

Add import:

```tsx
import { WidgetEditorPage } from '@/pages/WidgetEditorPage';
```

Add routes before `callbackRoute`:

```tsx
const widgetNewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.WIDGET_NEW,
  beforeLoad: requireAuth,
  component: WidgetEditorPage,
});

const widgetEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: ERoutes.WIDGET_EDIT,
  beforeLoad: requireAuth,
  component: WidgetEditorPage,
});
```

Add to routeTree:

```tsx
const routeTree = rootRoute.addChildren([
  // ... existing routes ...
  widgetNewRoute,
  widgetEditRoute,
  callbackRoute,
]);
```

Note: `WidgetEditorPage` doesn't exist yet — create a placeholder file first:

Create `src/pages/WidgetEditorPage.tsx`:

```tsx
import { Typography } from 'antd';
export function WidgetEditorPage() {
  return <Typography.Text>Widget Editor — coming soon</Typography.Text>;
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`

- [ ] **Step 4: Commit**

```bash
git add src/routes.ts src/router.tsx src/pages/WidgetEditorPage.tsx
git commit -m "feat(widget): add widget editor routes"
```

---

### Task 3: Create widgetColumns

**Files:**

- Create: `src/pages/profile/widgetColumns.tsx`

- [ ] **Step 1: Create widgetColumns.tsx**

Create `src/pages/profile/widgetColumns.tsx` following the layoutColumns pattern:

```tsx
import { Button, Dropdown, Tag, Tooltip, Typography } from 'antd';
import { LockOutlined, GlobalOutlined, MoreOutlined } from '@ant-design/icons';
import type { TFunction } from 'i18next';
import type { NavigateFn } from '@tanstack/react-router';
import type { MenuProps } from 'antd';
import { subject } from '@casl/ability';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import { formatDate } from '@/lib/formatDate';
import type { WidgetRecord } from '@/lib/types';
import type { TColumns } from '@/components/Table/types';
import {
  columnFilter,
  type TColumnFilter,
} from '@/components/Table/filterUtil';
import { columnSorter } from '@/components/Table/sorterUtil';
import type { FilterValue } from 'antd/es/table/interface';

type TFilters = Record<string, FilterValue | null>;
type TSorts = { order?: 'ascend' | 'descend' | null; columnKey?: string };

type WidgetColumnsOptions = {
  t: TFunction;
  navigate: NavigateFn;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<WidgetRecord>) => void;
  entities: WidgetRecord[];
  filteredInfo: TFilters;
  sortedInfo: TSorts;
};

const CATEGORY_COLORS: Record<string, string> = {
  media: 'magenta',
  data: 'cyan',
  content: 'blue',
  embed: 'purple',
  utility: 'orange',
};

const RESOURCE_COLORS: Record<string, string> = {
  youtube: 'red',
  image: 'green',
  iframe: 'purple',
  component: 'blue',
  empty: 'default',
};

export function getWidgetColumns({
  t,
  navigate,
  onDelete,
  onUpdate,
  entities,
  filteredInfo,
  sortedInfo,
}: WidgetColumnsOptions): TColumns<WidgetRecord> {
  return [
    {
      title: t('common.columnId'),
      dataIndex: 'name',
      key: 'name',
      filterSearch: true,
      ...(columnFilter(
        filteredInfo,
        entities,
        'name',
      ) as TColumnFilter<WidgetRecord>),
      ...columnSorter(sortedInfo, 'name'),
    },
    {
      title: t('widget.columnCategory', 'Category'),
      dataIndex: 'category',
      key: 'category',
      width: 110,
      concealable: true,
      ...(columnFilter(
        filteredInfo,
        entities,
        'category',
      ) as TColumnFilter<WidgetRecord>),
      render: (cat: string) => (
        <Tag color={CATEGORY_COLORS[cat] ?? 'default'}>{cat}</Tag>
      ),
    },
    {
      title: t('widget.columnResource', 'Resource'),
      dataIndex: 'resource',
      key: 'resource',
      width: 110,
      concealable: true,
      ...(columnFilter(
        filteredInfo,
        entities,
        'resource',
      ) as TColumnFilter<WidgetRecord>),
      render: (res: string) => (
        <Tag color={RESOURCE_COLORS[res] ?? 'default'}>{res}</Tag>
      ),
    },
    {
      title: t('common.columnStatus'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      concealable: true,
      ...(columnFilter(
        filteredInfo,
        entities,
        'status',
      ) as TColumnFilter<WidgetRecord>),
      render: (status: string) => {
        const color =
          status === 'published'
            ? 'green'
            : status === 'draft'
              ? 'blue'
              : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: t('widget.columnPublic', 'Public'),
      dataIndex: 'is_public',
      key: 'is_public',
      width: 90,
      concealable: true,
      ...(columnFilter(filteredInfo, entities, 'is_public', (v) =>
        v ? 'Public' : 'Private',
      ) as TColumnFilter<WidgetRecord>),
      render: (isPublic: boolean) => (
        <Tooltip title={isPublic ? t('layout.public') : t('layout.private')}>
          {isPublic ? <GlobalOutlined /> : <LockOutlined />}
        </Tooltip>
      ),
    },
    {
      title: t('common.columnUpdated'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      concealable: true,
      ...columnSorter(sortedInfo, 'updated_at'),
      render: (date: string) => formatDate(date),
    },
    {
      title: t('common.columnCreated'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      concealable: true,
      ...columnSorter(sortedInfo, 'created_at'),
      render: (date: string) => formatDate(date),
    },
    {
      title: t('common.columnActions'),
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: unknown, record: WidgetRecord) => {
        const widgetSubject = subject(ESubject.WIDGET, {
          kind: ESubject.WIDGET,
          user_id: record.user_id,
        });
        const items: MenuProps['items'] = [];

        items.push({
          key: 'edit',
          label: t('common.edit'),
        });
        items.push({
          key: record.status === 'published' ? 'unpublish' : 'publish',
          label:
            record.status === 'published'
              ? t('layout.unpublish')
              : t('layout.publish'),
        });
        items.push({
          key: 'togglePublic',
          label: record.is_public ? t('layout.private') : t('layout.public'),
        });
        items.push({ type: 'divider' });
        items.push({
          key: 'delete',
          label: t('common.delete'),
          danger: true,
        });

        const handleClick: MenuProps['onClick'] = ({ key }) => {
          if (key === 'edit') {
            void navigate({
              to: ERoutes.WIDGET_EDIT as string,
              params: { widgetId: record.id },
            });
          } else if (key === 'publish') {
            onUpdate(record.id, { status: 'published' });
          } else if (key === 'unpublish') {
            onUpdate(record.id, { status: 'draft' });
          } else if (key === 'togglePublic') {
            onUpdate(record.id, { is_public: !record.is_public });
          } else if (key === 'delete') {
            onDelete(record.id);
          }
        };

        return (
          <Can I={EAction.EDIT} this={widgetSubject}>
            <Dropdown
              menu={{ items, onClick: handleClick }}
              trigger={['click']}
            >
              <Button size="small" icon={<MoreOutlined />} />
            </Dropdown>
          </Can>
        );
      },
    },
  ] as TColumns<WidgetRecord>;
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/widgetColumns.tsx
git commit -m "feat(widget): create widget table columns"
```

---

### Task 4: Rewrite WidgetsSection with table

**Files:**

- Modify: `src/pages/profile/WidgetsSection.tsx`

- [ ] **Step 1: Replace placeholder with full table**

Replace entire `src/pages/profile/WidgetsSection.tsx`:

```tsx
import { useMemo } from 'react';
import { Button, Table } from 'antd';
import { PlusOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/auth/AuthContext';
import { Can } from '@/auth/Can';
import { EAction, ESubject } from '@/auth/abilities';
import { ERoutes } from '@/routes';
import {
  useWidgets,
  useUpdateWidget,
  useDeleteWidget,
} from '@/lib/hooks/useWidgetQueries';
import type { WidgetRecord } from '@/lib/types';
import { useTable } from '@/lib/hooks/useTable';
import { useColumnsToggle } from '@/lib/hooks/useColumnsToggle';
import { GridToolbar } from '@/components/Table/GridToolbar';
import { HideColumns } from '@/components/Table/HideColumns';
import { TableFooter } from '@/components/Table/TableFooter';
import { PageLayout, PageTitle } from '@/components/PageLayout';
import { getWidgetColumns } from './widgetColumns';

export function WidgetsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: widgets = [], isFetching, refetch } = useWidgets(user?.id);
  const updateWidget = useUpdateWidget();
  const deleteWidget = useDeleteWidget();

  const {
    tableParams,
    filteredInfo,
    sortedInfo,
    handleTableChange,
    computedFilteredCount,
  } = useTable(widgets, widgets.length, { persistToUrl: true });

  const columns = useMemo(
    () =>
      getWidgetColumns({
        t,
        navigate,
        onDelete: (id) => deleteWidget.mutate(id),
        onUpdate: (id, data) => updateWidget.mutate({ id, data }),
        entities: widgets,
        filteredInfo,
        sortedInfo,
      }),
    [
      t,
      navigate,
      deleteWidget,
      updateWidget,
      widgets,
      filteredInfo,
      sortedInfo,
    ],
  );

  const { filteredColumns, columnsList, selectedColumns, setSelectedColumns } =
    useColumnsToggle(columns, ['created_at']);

  return (
    <PageLayout
      title={<PageTitle name={t('profile.widgets')} Icon={AppstoreOutlined} />}
      subject={ESubject.WIDGET}
    >
      <GridToolbar
        onRefresh={() => void refetch()}
        exportData={widgets}
        exportFileName="widgets"
      >
        <Can I={EAction.CREATE} a={ESubject.WIDGET}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => void navigate({ to: ERoutes.WIDGET_NEW as string })}
          >
            {t('widget.newWidget', 'New Widget')}
          </Button>
        </Can>
        {columnsList.length > 0 && (
          <HideColumns
            columnsList={columnsList}
            selectedColumns={selectedColumns}
            onChange={setSelectedColumns}
          />
        )}
      </GridToolbar>
      <Table
        dataSource={widgets}
        columns={filteredColumns}
        rowKey="id"
        loading={isFetching}
        pagination={tableParams.pagination}
        size="small"
        scroll={{ x: 800 }}
        onChange={
          handleTableChange as Parameters<
            typeof Table<WidgetRecord>
          >['0']['onChange']
        }
        footer={() => (
          <TableFooter
            computedFilteredCount={computedFilteredCount}
            totalCount={widgets.length}
          />
        )}
      />
    </PageLayout>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/profile/WidgetsSection.tsx
git commit -m "feat(widget): replace widgets placeholder with CRUD table"
```

---

### Task 5: Create WidgetEditorPage

**Files:**

- Modify: `src/pages/WidgetEditorPage.tsx` (replace placeholder)

- [ ] **Step 1: Create full widget editor**

Replace `src/pages/WidgetEditorPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import {
  App as AntApp,
  Button,
  Form,
  Input,
  Select,
  Spin,
  Switch,
  Tabs,
  Typography,
  Space,
} from 'antd';
import { useTranslation } from 'react-i18next';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AppHeader } from '@/components/AppHeader';
import { ERoutes } from '@/routes';
import {
  useWidget,
  useCreateWidget,
  useUpdateWidget,
} from '@/lib/hooks/useWidgetQueries';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';
import { EWidgetCategory, EWidgetResource } from '@/lib/types';

const { TextArea } = Input;
const { Text } = Typography;

const CATEGORY_OPTIONS = Object.values(EWidgetCategory).map((v) => ({
  value: v,
  label: v,
}));
const RESOURCE_OPTIONS = Object.values(EWidgetResource).map((v) => ({
  value: v,
  label: v,
}));

type FormValues = {
  name: string;
  description: string;
  category: string;
  resource: string;
  tags: string[];
  contentValue: string;
  thumbnail: string;
  isEditable: boolean;
  isClonable: boolean;
  isPublic: boolean;
};

export function WidgetEditorPage() {
  const { widgetId } = useParams({ strict: false }) as { widgetId?: string };
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<FormValues>();
  const isNew = !widgetId;

  const {
    data: widget,
    isLoading,
    error: loadError,
  } = useWidget(isNew ? undefined : widgetId);
  const createMutation = useCreateWidget();
  const updateMutation = useUpdateWidget();

  useErrorNotification(loadError, 'Failed to load widget');
  useErrorNotification(createMutation.error, 'Failed to create widget');
  useErrorNotification(updateMutation.error, 'Failed to update widget');

  useEffect(() => {
    if (widget) {
      form.setFieldsValue({
        name: widget.name,
        description: widget.description,
        category: widget.category,
        resource: widget.resource,
        tags: widget.tags,
        contentValue: widget.content?.value ?? '',
        thumbnail: widget.thumbnail ?? '',
        isEditable: widget.config?.isEditable ?? false,
        isClonable: widget.config?.isClonable ?? true,
        isPublic: widget.is_public,
      });
    }
  }, [widget, form]);

  function handleFinish(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description,
      category: values.category,
      resource: values.resource,
      tags: values.tags,
      content: { value: values.contentValue },
      thumbnail: values.thumbnail || null,
      config: {
        isEditable: values.isEditable,
        isClonable: values.isClonable,
      },
      is_public: values.isPublic,
    };

    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: async (created) => {
          void message.success(t('widget.widgetCreated', 'Widget created'));
          await navigate({
            to: ERoutes.WIDGET_EDIT as string,
            params: { widgetId: created.id },
          });
        },
      });
    } else {
      updateMutation.mutate(
        { id: widgetId, data: payload },
        {
          onSuccess: () =>
            void message.success(t('widget.widgetSaved', 'Widget saved')),
        },
      );
    }
  }

  if (!isNew && isLoading) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <AppHeader>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            void navigate({ to: ERoutes.PROFILE_WIDGETS as string })
          }
        >
          {t('common.back')}
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={createMutation.isPending || updateMutation.isPending}
          onClick={() => form.submit()}
        >
          {t('common.save')}
        </Button>
      </AppHeader>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          padding: 24,
          maxWidth: 700,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: 'Empty',
            description: 'Empty widget',
            category: 'utility',
            resource: 'empty',
            tags: ['empty', 'widget', 'default'],
            contentValue: '',
            thumbnail: '',
            isEditable: false,
            isClonable: true,
            isPublic: false,
          }}
          onFinish={handleFinish}
        >
          <Tabs
            items={[
              {
                key: 'general',
                label: t('widget.tabGeneral', 'General'),
                children: (
                  <>
                    <Form.Item
                      label={t('widget.name', 'Name')}
                      name="name"
                      rules={[{ required: true }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      label={t('widget.description', 'Description')}
                      name="description"
                    >
                      <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                      label={t('widget.columnCategory', 'Category')}
                      name="category"
                      rules={[{ required: true }]}
                    >
                      <Select options={CATEGORY_OPTIONS} />
                    </Form.Item>
                    <Form.Item
                      label={t('widget.columnResource', 'Resource')}
                      name="resource"
                      rules={[{ required: true }]}
                    >
                      <Select options={RESOURCE_OPTIONS} />
                    </Form.Item>
                    <Form.Item label={t('widget.tags', 'Tags')} name="tags">
                      <Select mode="tags" />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'content',
                label: t('widget.tabContent', 'Content'),
                children: (
                  <>
                    <Form.Item
                      label={t('widget.contentValue', 'Content Value')}
                      name="contentValue"
                      extra={t(
                        'widget.contentHelp',
                        'URL for youtube/image, text/code for others',
                      )}
                    >
                      <TextArea rows={6} />
                    </Form.Item>
                    <Form.Item
                      label={t('widget.thumbnail', 'Thumbnail URL')}
                      name="thumbnail"
                    >
                      <Input />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'config',
                label: t('widget.tabConfig', 'Config'),
                children: (
                  <>
                    <Form.Item
                      label={t('widget.isEditable', 'Editable')}
                      name="isEditable"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      label={t('widget.isClonable', 'Clonable')}
                      name="isClonable"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'settings',
                label: t('widget.tabSettings', 'Settings'),
                children: (
                  <>
                    <Form.Item
                      label={t('widget.isPublic', 'Public')}
                      name="isPublic"
                      valuePropName="checked"
                      extra={t(
                        'widget.publicHelp',
                        'When public and published, other users can use this widget',
                      )}
                    >
                      <Switch />
                    </Form.Item>
                    {widget && (
                      <Space orientation="vertical">
                        <Text type="secondary">
                          {t('common.columnStatus')}: {widget.status}
                        </Text>
                        <Text type="secondary">
                          {t('common.columnCreated')}: {widget.created_at}
                        </Text>
                        <Text type="secondary">
                          {t('common.columnUpdated')}: {widget.updated_at}
                        </Text>
                      </Space>
                    )}
                  </>
                ),
              },
            ]}
          />
        </Form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/pages/WidgetEditorPage.tsx
git commit -m "feat(widget): create WidgetEditorPage with form tabs"
```

---

### Task 6: Add i18n translations for widgets

**Files:**

- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ru.json`
- Modify: `src/i18n/locales/he.json`

- [ ] **Step 1: Add widget translations to all 3 locale files**

Add `"widget"` section to each locale JSON, after `"layout"` section.

**en.json:**

```json
"widget": {
  "newWidget": "New Widget",
  "widgetCreated": "Widget created",
  "widgetSaved": "Widget saved",
  "columnCategory": "Category",
  "columnResource": "Resource",
  "columnPublic": "Public",
  "name": "Name",
  "description": "Description",
  "tags": "Tags",
  "tabGeneral": "General",
  "tabContent": "Content",
  "tabConfig": "Config",
  "tabSettings": "Settings",
  "contentValue": "Content Value",
  "contentHelp": "URL for youtube/image, text/code for others",
  "thumbnail": "Thumbnail URL",
  "isEditable": "Editable",
  "isClonable": "Clonable",
  "isPublic": "Public",
  "publicHelp": "When public and published, other users can use this widget"
}
```

**ru.json:**

```json
"widget": {
  "newWidget": "Новый виджет",
  "widgetCreated": "Виджет создан",
  "widgetSaved": "Виджет сохранён",
  "columnCategory": "Категория",
  "columnResource": "Ресурс",
  "columnPublic": "Публичный",
  "name": "Название",
  "description": "Описание",
  "tags": "Теги",
  "tabGeneral": "Основное",
  "tabContent": "Контент",
  "tabConfig": "Конфигурация",
  "tabSettings": "Настройки",
  "contentValue": "Значение контента",
  "contentHelp": "URL для youtube/image, текст/код для остальных",
  "thumbnail": "URL миниатюры",
  "isEditable": "Редактируемый",
  "isClonable": "Клонируемый",
  "isPublic": "Публичный",
  "publicHelp": "Когда публичный и опубликованный, другие пользователи могут использовать этот виджет"
}
```

**he.json:**

```json
"widget": {
  "newWidget": "ווידג׳ט חדש",
  "widgetCreated": "הווידג׳ט נוצר",
  "widgetSaved": "הווידג׳ט נשמר",
  "columnCategory": "קטגוריה",
  "columnResource": "משאב",
  "columnPublic": "ציבורי",
  "name": "שם",
  "description": "תיאור",
  "tags": "תגיות",
  "tabGeneral": "כללי",
  "tabContent": "תוכן",
  "tabConfig": "הגדרות",
  "tabSettings": "אפשרויות",
  "contentValue": "ערך תוכן",
  "contentHelp": "URL עבור youtube/image, טקסט/קוד עבור אחרים",
  "thumbnail": "URL תמונה ממוזערת",
  "isEditable": "ניתן לעריכה",
  "isClonable": "ניתן לשכפול",
  "isPublic": "ציבורי",
  "publicHelp": "כשציבורי ומפורסם, משתמשים אחרים יכולים להשתמש בווידג׳ט זה"
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(widget): add i18n translations for widget UI"
```
