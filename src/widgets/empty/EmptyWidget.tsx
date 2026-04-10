import type { WidgetComponentProps } from '../types';

export function EmptyWidget({ content }: WidgetComponentProps) {
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
      {content.value || 'Empty'}
    </div>
  );
}
