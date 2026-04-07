import { useEffect } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { App as AntApp, Button, Form, Input, Select, Spin, Switch, Tabs, Typography, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { AppHeader } from '@/components/AppHeader';
import { ERoutes } from '@/routes';
import { useWidget, useCreateWidget, useUpdateWidget } from '@/lib/hooks/useWidgetQueries';
import { useErrorNotification } from '@/lib/hooks/useErrorNotification';
import { EWidgetCategory, EWidgetResource } from '@/lib/types';

const { TextArea } = Input;
const { Text } = Typography;

const CATEGORY_OPTIONS = Object.values(EWidgetCategory).map((v) => ({ value: v, label: v }));
const RESOURCE_OPTIONS = Object.values(EWidgetResource).map((v) => ({ value: v, label: v }));

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

  const { data: widget, isLoading, error: loadError } = useWidget(isNew ? undefined : widgetId);
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
      category: values.category as EWidgetCategory,
      resource: values.resource as EWidgetResource,
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
          void message.success(t('widget.widgetCreated'));
          await navigate({ to: ERoutes.WIDGET_EDIT as string, params: { widgetId: created.id } });
        },
      });
    } else {
      updateMutation.mutate({ id: widgetId, data: payload }, {
        onSuccess: () => void message.success(t('widget.widgetSaved')),
      });
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
          onClick={() => void navigate({ to: ERoutes.PROFILE_WIDGETS as string })}
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
      <div style={{ flex: 1, overflow: 'auto', padding: 24, maxWidth: 700, margin: '0 auto', width: '100%' }}>
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
          <Tabs items={[
            {
              key: 'general',
              label: t('widget.tabGeneral'),
              children: (
                <>
                  <Form.Item label={t('widget.name')} name="name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label={t('widget.description')} name="description">
                    <TextArea rows={3} />
                  </Form.Item>
                  <Form.Item label={t('widget.columnCategory')} name="category" rules={[{ required: true }]}>
                    <Select options={CATEGORY_OPTIONS} />
                  </Form.Item>
                  <Form.Item label={t('widget.columnResource')} name="resource" rules={[{ required: true }]}>
                    <Select options={RESOURCE_OPTIONS} />
                  </Form.Item>
                  <Form.Item label={t('widget.tags')} name="tags">
                    <Select mode="tags" />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'content',
              label: t('widget.tabContent'),
              children: (
                <>
                  <Form.Item label={t('widget.contentValue')} name="contentValue" extra={t('widget.contentHelp')}>
                    <TextArea rows={6} />
                  </Form.Item>
                  <Form.Item label={t('widget.thumbnail')} name="thumbnail">
                    <Input />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'config',
              label: t('widget.tabConfig'),
              children: (
                <>
                  <Form.Item label={t('widget.isEditable')} name="isEditable" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                  <Form.Item label={t('widget.isClonable')} name="isClonable" valuePropName="checked">
                    <Switch />
                  </Form.Item>
                </>
              ),
            },
            {
              key: 'settings',
              label: t('widget.tabSettings'),
              children: (
                <>
                  <Form.Item label={t('widget.isPublic')} name="isPublic" valuePropName="checked" extra={t('widget.publicHelp')}>
                    <Switch />
                  </Form.Item>
                  {widget && (
                    <Space orientation="vertical">
                      <Text type="secondary">{t('common.columnStatus')}: {widget.status}</Text>
                      <Text type="secondary">{t('common.columnCreated')}: {widget.created_at}</Text>
                      <Text type="secondary">{t('common.columnUpdated')}: {widget.updated_at}</Text>
                    </Space>
                  )}
                </>
              ),
            },
          ]} />
        </Form>
      </div>
    </div>
  );
}
