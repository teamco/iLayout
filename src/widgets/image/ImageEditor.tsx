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
