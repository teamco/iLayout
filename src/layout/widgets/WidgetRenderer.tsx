// src/layout/widgets/WidgetRenderer.tsx
import React, { CSSProperties } from 'react';
import type { WidgetRef } from '../types';
import { getWidget } from './widgetRegistry';

type Props = {
  widget: WidgetRef;
  isDragging?: boolean;
};

function getBoundsStyle(widget: WidgetRef): CSSProperties {
  const { bounds } = widget;
  if (!bounds) return { width: '100%', height: '100%' };
  return {
    width: bounds.width ?? '100%',
    height: bounds.height ?? '100%',
    minWidth: bounds.minWidth,
    minHeight: bounds.minHeight,
    maxWidth: bounds.maxWidth,
    maxHeight: bounds.maxHeight,
  };
}

function getAlignStyle(widget: WidgetRef): CSSProperties {
  const align = widget.bounds?.align ?? 'top-left';
  const map: Record<string, CSSProperties> = {
    'top-left':      { justifyContent: 'flex-start', alignItems: 'flex-start' },
    'top-center':    { justifyContent: 'center',     alignItems: 'flex-start' },
    'top-right':     { justifyContent: 'flex-end',   alignItems: 'flex-start' },
    'center-left':   { justifyContent: 'flex-start', alignItems: 'center' },
    'center':        { justifyContent: 'center',     alignItems: 'center' },
    'center-right':  { justifyContent: 'flex-end',   alignItems: 'center' },
    'bottom-left':   { justifyContent: 'flex-start', alignItems: 'flex-end' },
    'bottom-center': { justifyContent: 'center',     alignItems: 'flex-end' },
    'bottom-right':  { justifyContent: 'flex-end',   alignItems: 'flex-end' },
  };
  return map[align] ?? map['top-left'];
}

export function WidgetRenderer({ widget, isDragging }: Props) {
  const def = getWidget(widget.widgetId);

  const containerStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    ...getAlignStyle(widget),
    overflow: 'hidden',
  };

  const innerStyle: CSSProperties = getBoundsStyle(widget);

  let content: React.ReactNode;

  if (widget.type === 'iframe') {
    content = (
      <iframe
        src={String(widget.config.url ?? '')}
        style={{
          ...innerStyle,
          border: 'none',
          pointerEvents: isDragging ? 'none' : 'auto',
        }}
        title={widget.widgetId}
      />
    );
  } else if (widget.type === 'component' && def?.component) {
    const Comp = def.component;
    content = (
      <div style={innerStyle}>
        <Comp config={widget.config} />
      </div>
    );
  } else {
    content = (
      <div style={{ ...innerStyle, padding: 8, color: '#888', fontSize: 12 }}>
        {def?.label ?? widget.widgetId}
      </div>
    );
  }

  return <div style={containerStyle}>{content}</div>;
}
