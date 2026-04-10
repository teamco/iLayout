// packages/embed/src/widgets/EmptyWidget.tsx
import type { WidgetComponentProps } from '../types';

export function EmptyWidget({ content }: WidgetComponentProps) {
  return <div className="al-widget-empty">{content.value || 'Empty'}</div>;
}
