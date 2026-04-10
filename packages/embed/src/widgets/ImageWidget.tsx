// packages/embed/src/widgets/ImageWidget.tsx
import type { WidgetComponentProps } from '../types';

export function ImageWidget({ content }: WidgetComponentProps) {
  if (!content.value) {
    return <div className="al-widget-empty">No image URL</div>;
  }

  return <img src={content.value} alt="Widget" className="al-widget-image" />;
}
