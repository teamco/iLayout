// packages/embed/src/widgets/YouTubeWidget.tsx
import type { WidgetComponentProps } from '../types';

function toEmbedUrl(url: string): string {
  if (!url) return '';
  if (url.includes('/embed/')) return url;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return url;
}

export function YouTubeWidget({ content }: WidgetComponentProps) {
  const embedUrl = toEmbedUrl(content.value);

  if (!embedUrl) {
    return <div className="al-widget-empty">No YouTube URL</div>;
  }

  return (
    <iframe
      src={embedUrl}
      className="al-widget-iframe"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      title="YouTube video"
    />
  );
}
