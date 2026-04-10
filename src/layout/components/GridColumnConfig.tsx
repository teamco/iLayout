import { useEffect } from 'react';
import { Modal, Form, InputNumber, Select, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import type { GridRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = {
  open: boolean;
  columnId: string | null;
  onClose: () => void;
};

type FormValues = {
  sizeValue: number;
  sizeUnit: string;
};

function parseSize(size: string): { value: number; unit: string } {
  if (size === '1fr') return { value: 1, unit: 'fr' };
  const match = size.match(/^(-?\d+(?:\.\d+)?)\s*(px|%|fr)$/);
  if (match) return { value: Number(match[1]), unit: match[2] };
  return { value: parseFloat(size) || 200, unit: 'px' };
}

export function GridColumnConfig({ open, columnId, onClose }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm<FormValues>();
  const root = useLayoutStore((s) => s.root);
  const resizeGridColumn = useLayoutStore((s) => s.resizeGridColumn);
  const removeGridColumn = useLayoutStore((s) => s.removeGridColumn);

  const grid = root.type === 'grid' ? (root as unknown as GridRoot) : null;
  const column = grid?.columns.find((c) => c.id === columnId);

  useEffect(() => {
    if (open && column) {
      const parsed = parseSize(column.size);
      form.setFieldsValue({
        sizeValue: parsed.value,
        sizeUnit: parsed.unit,
      });
    }
  }, [open, column, form]);

  function handleSave() {
    if (!columnId) return;
    const values = form.getFieldsValue();
    const size =
      values.sizeUnit === 'fr'
        ? `${values.sizeValue}fr`
        : `${values.sizeValue}${values.sizeUnit}`;
    resizeGridColumn(columnId, size);
    onClose();
  }

  function handleDelete() {
    if (!columnId) return;
    removeGridColumn(columnId);
    onClose();
  }

  return (
    <Modal
      title={t('layout.columnConfig', 'Column Config')}
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
      width={320}
      forceRender
      destroyOnHidden={false}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ sizeValue: 200, sizeUnit: 'px' }}
      >
        <Form.Item label={t('layout.columnWidth', 'Width')}>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="sizeValue" noStyle>
              <InputNumber min={1} style={{ flex: 1 }} />
            </Form.Item>
            <Form.Item name="sizeUnit" noStyle>
              <Select
                options={[
                  { value: 'px', label: 'px' },
                  { value: '%', label: '%' },
                  { value: 'fr', label: 'fr' },
                ]}
                style={{ width: 65 }}
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      </Form>
    </Modal>
  );
}
