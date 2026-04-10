import { useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { SectionHeight, ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = { open: boolean; sectionId: string | null; onClose: () => void };

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

export function SectionConfig({ open, sectionId, onClose }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const root = useLayoutStore((s) => s.root);
  const resizeSection = useLayoutStore((s) => s.resizeSection);
  const updateSectionConfig = useLayoutStore((s) => s.updateSectionConfig);
  const removeSection = useLayoutStore((s) => s.removeSection);

  const scrollRoot =
    root.type === 'scroll' ? (root as unknown as ScrollRoot) : null;
  const section = scrollRoot?.sections.find((s) => s.id === sectionId);

  useEffect(() => {
    if (open && section) {
      const h = parseHeight(section.height);
      form.setFieldsValue({
        heightType: h.type as 'auto' | 'fixed' | 'min',
        heightValue: h.value,
        heightUnit: h.unit,
        overlap: section.overlap ? parseFloat(section.overlap) || 0 : 0,
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
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button danger onClick={handleDelete}>
            {t('common.delete')}
          </Button>
          <Space>
            <Button onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="primary" onClick={handleSave}>
              {t('common.save')}
            </Button>
          </Space>
        </div>
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
