// src/layout/widgets/WidgetGallery.tsx
import React from 'react';
import { Drawer, Card } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { getAllWidgets, type WidgetDefinition } from './widgetRegistry';
import type { WidgetRef } from '../types';

type Props = {
  open: boolean;
  onSelect: (widget: WidgetRef) => void;
  onClose: () => void;
};

function DraggableWidgetCard({ def, onSelect }: { def: WidgetDefinition; onSelect: (w: WidgetRef) => void }) {
  const widgetRef: WidgetRef = {
    widgetId: def.widgetId,
    type: def.defaultType ?? 'component',
    config: def.defaultConfig,
  };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gallery-${def.widgetId}`,
    data: { type: 'gallery', widgetRef },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}>
      <Card
        size="small"
        hoverable
        onClick={() => onSelect(widgetRef)}
      >
        <Card.Meta title={def.label} description={def.description} />
      </Card>
    </div>
  );
}

export function WidgetGallery({ open, onSelect, onClose }: Props) {
  const widgets = getAllWidgets();

  return (
    <Drawer title="Widget Gallery" open={open} onClose={onClose} width={340}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {widgets.map(def => (
          <DraggableWidgetCard key={def.widgetId} def={def} onSelect={onSelect} />
        ))}
      </div>
    </Drawer>
  );
}
