import { useState, useCallback } from 'react';
import { App as AntApp, Modal, Tabs, Input, Button, Typography, Space } from 'antd';
import { CopyOutlined, DownloadOutlined, ImportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLayoutStore } from '@/layout/store/layoutStore';

type Props = {
  open: boolean;
  onClose: () => void;
};

function formatDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function downloadJson(json: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `layout-${formatDate()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function validateLayout(data: unknown): data is { id: string; type: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'type' in data &&
    typeof (data as Record<string, unknown>).id === 'string' &&
    typeof (data as Record<string, unknown>).type === 'string'
  );
}

function ViewTab() {
  const root = useLayoutStore(s => s.root);
  const json = JSON.stringify(root, null, 2);
  const { message } = AntApp.useApp();
  const { t } = useTranslation();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      message.success(t('jsonModal.copiedToClipboard'));
    });
  }, [json, message, t]);

  return (
    <>
      <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12, margin: 0 }}>{json}</pre>
      <Space style={{ marginTop: 12 }}>
        <Button icon={<CopyOutlined />} onClick={handleCopy}>{t('jsonModal.copy')}</Button>
        <Button icon={<DownloadOutlined />} onClick={() => downloadJson(json)}>{t('jsonModal.export')}</Button>
      </Space>
    </>
  );
}

function ImportTab({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleImport = useCallback(() => {
    setError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError(t('jsonModal.invalidJson'));
      return;
    }
    if (!validateLayout(parsed)) {
      setError(t('jsonModal.invalidLayout'));
      return;
    }
    useLayoutStore.setState({ root: parsed as ReturnType<typeof useLayoutStore.getState>['root'] });
    setText('');
    onClose();
  }, [text, onClose, t]);

  return (
    <>
      <Input.TextArea
        rows={12}
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
        placeholder={t('jsonModal.pastePlaceholder')}
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      {error && (
        <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </Typography.Text>
      )}
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" icon={<ImportOutlined />} onClick={handleImport} disabled={!text.trim()}>
          {t('jsonModal.importBtn')}
        </Button>
      </Space>
    </>
  );
}

export function LayoutJsonModal({ open, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal title={t('jsonModal.title')} open={open} onCancel={onClose} footer={null} width={640}>
      <Tabs
        items={[
          { key: 'view', label: t('jsonModal.view'), children: <ViewTab /> },
          { key: 'import', label: t('jsonModal.import'), children: <ImportTab onClose={onClose} /> },
        ]}
      />
    </Modal>
  );
}
