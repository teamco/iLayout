import { useEffect, useState } from 'react';
import { Modal, Tabs, Form, Input, InputNumber, Select, Button, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { WidgetRef, WidgetBounds, CssValue } from '@/layout/types';
import type { EWidgetResource } from '@/lib/types';
import { getWidgetDef } from '@/widgets/registry';

const { Text } = Typography;
const { TextArea } = Input;

type Props = {
  open: boolean;
  widget: WidgetRef;
  onClose: () => void;
  onChange: (widget: WidgetRef) => void;
};

const ALIGN_OPTIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
] as const;

const UNIT_OPTIONS = [
  { value: 'px', label: 'px' },
  { value: '%', label: '%' },
];

function parseCssValue(val?: CssValue): { num: number; unit: 'px' | '%' } {
  if (!val) return { num: 0, unit: 'px' };
  const match = String(val).match(/^(-?\d+(?:\.\d+)?)\s*(px|%)$/);
  if (match) return { num: Number(match[1]), unit: match[2] as 'px' | '%' };
  const n = parseFloat(String(val));
  return { num: isNaN(n) ? 0 : n, unit: 'px' };
}

function toCssValue(num: number, unit: string): CssValue {
  return `${num}${unit}`;
}

function CssValueField({ name }: { name: string }) {
  return (
    <Space.Compact style={{ width: '100%' }}>
      <Form.Item name={`${name}Num`} noStyle>
        <InputNumber min={0} style={{ flex: 1 }} />
      </Form.Item>
      <Form.Item name={`${name}Unit`} noStyle>
        <Select options={UNIT_OPTIONS} style={{ width: 65 }} />
      </Form.Item>
    </Space.Compact>
  );
}

export function WidgetConfigModal({ open, widget, onClose, onChange }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [contentValue, setContentValue] = useState(widget.content?.value ?? '');

  const def = getWidgetDef(widget.resource as EWidgetResource);
  const Editor = def?.editor;

  useEffect(() => {
    if (open) {
      const mt = parseCssValue(widget.bounds?.marginTop);
      const mb = parseCssValue(widget.bounds?.marginBottom);
      const ml = parseCssValue(widget.bounds?.marginLeft);
      const mr = parseCssValue(widget.bounds?.marginRight);
      form.setFieldsValue({
        marginTopNum: mt.num, marginTopUnit: mt.unit,
        marginBottomNum: mb.num, marginBottomUnit: mb.unit,
        marginLeftNum: ml.num, marginLeftUnit: ml.unit,
        marginRightNum: mr.num, marginRightUnit: mr.unit,
        align: widget.bounds?.align ?? 'top-left',
      });
      setContentValue(widget.content?.value ?? '');
    }
  }, [open, widget, form]);

  function handleSave() {
    const values = form.getFieldsValue();
    const bounds: WidgetBounds = {
      marginTop: toCssValue(values.marginTopNum ?? 0, values.marginTopUnit ?? 'px'),
      marginBottom: toCssValue(values.marginBottomNum ?? 0, values.marginBottomUnit ?? 'px'),
      marginLeft: toCssValue(values.marginLeftNum ?? 0, values.marginLeftUnit ?? 'px'),
      marginRight: toCssValue(values.marginRightNum ?? 0, values.marginRightUnit ?? 'px'),
      align: values.align,
    };
    onChange({
      ...widget,
      content: { value: contentValue },
      bounds,
    });
    onClose();
  }

  const tabs = [];

  // Content tab — show custom editor or plain textarea
  tabs.push({
    key: 'content',
    label: t('widget.tabContent', 'Content'),
    children: Editor ? (
      <Editor
        content={{ value: contentValue }}
        onChange={(c) => setContentValue(c.value)}
      />
    ) : (
      <TextArea
        rows={4}
        value={contentValue}
        onChange={(e) => setContentValue(e.target.value)}
        placeholder={t('widget.contentHelp', 'Content value')}
      />
    ),
  });

  // CSS tab
  tabs.push({
    key: 'css',
    label: 'CSS',
    children: (
      <>
        <Text strong>{t('layout.margins')}</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <Form.Item label="Top" style={{ marginBottom: 8 }}>
            <CssValueField name="marginTop" />
          </Form.Item>
          <Form.Item label="Bottom" style={{ marginBottom: 8 }}>
            <CssValueField name="marginBottom" />
          </Form.Item>
          <Form.Item label="Left" style={{ marginBottom: 8 }}>
            <CssValueField name="marginLeft" />
          </Form.Item>
          <Form.Item label="Right" style={{ marginBottom: 8 }}>
            <CssValueField name="marginRight" />
          </Form.Item>
        </div>
        <Form.Item label={t('layout.align')} name="align">
          <Select options={ALIGN_OPTIONS.map((a) => ({ value: a, label: a }))} />
        </Form.Item>
      </>
    ),
  });

  return (
    <Modal
      title={t('layout.widgetConfig')}
      open={open}
      onCancel={onClose}
      destroyOnHidden={false}
      forceRender
      footer={
        <Space>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="primary" onClick={handleSave}>{t('common.save')}</Button>
        </Space>
      }
      width={500}
    >
      <Form form={form} layout="vertical">
        <Tabs defaultActiveKey="content" items={tabs} />
      </Form>
    </Modal>
  );
}
