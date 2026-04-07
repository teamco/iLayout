import { Input } from 'antd';
import type { WidgetEditorProps } from '../types';

function toEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return '';
}

export function YouTubeEditor({ content, onChange }: WidgetEditorProps) {
  const embedUrl = toEmbedUrl(content.value);

  return (
    <div>
      <Input
        placeholder="https://www.youtube.com/watch?v=..."
        value={content.value}
        onChange={(e) => onChange({ ...content, value: e.target.value })}
      />
      {embedUrl && (
        <div style={{ marginTop: 12, aspectRatio: '16/9', maxHeight: 300 }}>
          <iframe
            src={embedUrl}
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
