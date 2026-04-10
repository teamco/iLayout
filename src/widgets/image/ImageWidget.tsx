import type { WidgetComponentProps } from '../types';

export function ImageWidget({ content }: WidgetComponentProps) {
  if (!content.value) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-muted)',
          fontSize: 12,
        }}
      >
        No image URL
      </div>
    );
  }

  return (
    <img
      src={content.value}
      alt="Widget"
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
}
