import { useState, useCallback } from 'react';
import { Modal, Tabs, Input, Button, Typography, Space, message } from 'antd';
import { CopyOutlined, DownloadOutlined, ImportOutlined } from '@ant-design/icons';
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
  const [messageApi, contextHolder] = message.useMessage();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(json).then(() => {
      messageApi.success('Copied to clipboard');
    });
  }, [json, messageApi]);

  return (
    <>
      {contextHolder}
      <pre style={{ maxHeight: 400, overflow: 'auto', fontSize: 12, margin: 0 }}>{json}</pre>
      <Space style={{ marginTop: 12 }}>
        <Button icon={<CopyOutlined />} onClick={handleCopy}>Copy</Button>
        <Button icon={<DownloadOutlined />} onClick={() => downloadJson(json)}>Export</Button>
      </Space>
    </>
  );
}

function ImportTab({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const handleImport = useCallback(() => {
    setError('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      setError('Invalid JSON');
      return;
    }
    if (!validateLayout(parsed)) {
      setError('Invalid layout: missing "id" or "type" field');
      return;
    }
    useLayoutStore.setState({ root: parsed as ReturnType<typeof useLayoutStore.getState>['root'] });
    setText('');
    onClose();
  }, [text, onClose]);

  return (
    <>
      <Input.TextArea
        rows={12}
        value={text}
        onChange={e => { setText(e.target.value); setError(''); }}
        placeholder="Paste layout JSON here..."
        style={{ fontFamily: 'monospace', fontSize: 12 }}
      />
      {error && (
        <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
          {error}
        </Typography.Text>
      )}
      <Space style={{ marginTop: 12 }}>
        <Button type="primary" icon={<ImportOutlined />} onClick={handleImport} disabled={!text.trim()}>
          Import
        </Button>
      </Space>
    </>
  );
}

export function LayoutJsonModal({ open, onClose }: Props) {
  return (
    <Modal title="Layout JSON" open={open} onCancel={onClose} footer={null} width={640}>
      <Tabs
        items={[
          { key: 'view', label: 'View', children: <ViewTab /> },
          { key: 'import', label: 'Import', children: <ImportTab onClose={onClose} /> },
        ]}
      />
    </Modal>
  );
}
