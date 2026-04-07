// src/layout/widgets/WidgetRenderer.tsx
import React from 'react';
import clsx from 'clsx';
import type { WidgetRef } from '@/layout/types';
import type { EWidgetResource } from '@/lib/types';
import { getWidgetDef } from '@/widgets/registry';
import { useDragActive } from '@/layout/dnd/DragActiveContext';
import styles from './WidgetRenderer.module.less';

type Props = { widget: WidgetRef };

const ALIGN_CLASS: Record<string, string> = {
  'top-left':      styles.alignTopLeft,
  'top-center':    styles.alignTopCenter,
  'top-right':     styles.alignTopRight,
  'center-left':   styles.alignCenterLeft,
  'center':        styles.alignCenter,
  'center-right':  styles.alignCenterRight,
  'bottom-left':   styles.alignBottomLeft,
  'bottom-center': styles.alignBottomCenter,
  'bottom-right':  styles.alignBottomRight,
};

export function WidgetRenderer({ widget }: Props) {
  const def = getWidgetDef(widget.resource as EWidgetResource);
  const isDragActive = useDragActive();
  const { bounds } = widget;

  const alignClass = ALIGN_CLASS[bounds?.align ?? 'top-left'] ?? styles.alignTopLeft;

  const mt = bounds?.marginTop;
  const mr = bounds?.marginRight;
  const mb = bounds?.marginBottom;
  const ml = bounds?.marginLeft;
  const hasMargins = mt || mr || mb || ml;

  const containerStyle: React.CSSProperties = hasMargins ? {
    inset: `${mt ?? 0} ${mr ?? 0} ${mb ?? 0} ${ml ?? 0}`,
  } : {};

  let content: React.ReactNode;

  if (def) {
    const Comp = def.component;
    content = (
      <Comp
        content={widget.content ?? { value: '' }}
        config={{ isEditable: false, isClonable: true, ...widget.config }}
      />
    );
  } else {
    content = (
      <div className={clsx(styles.fallback, { [styles.dragActive]: isDragActive })}>
        {widget.widgetId}
      </div>
    );
  }

  return (
    <div className={clsx(styles.container, alignClass)} style={containerStyle}>
      {content}
    </div>
  );
}
