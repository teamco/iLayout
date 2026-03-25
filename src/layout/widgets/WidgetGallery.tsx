// src/layout/widgets/WidgetGallery.tsx
import React from 'react';
import { Drawer, Card } from 'antd';
import { getAllWidgets } from './widgetRegistry';
import type { WidgetRef } from '../types';

type Props = {
  open: boolean;
  onSelect: (widget: WidgetRef) => void;
  onClose: () => void;
};

export function WidgetGallery({ open, onSelect, onClose }: Props) {
  const widgets = getAllWidgets();

  return (
    <Drawer title="Widget Gallery" open={open} onClose={onClose} width={340}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {widgets.map(def => (
          <Card
            key={def.widgetId}
            size="small"
            hoverable
            onClick={() => onSelect({ widgetId: def.widgetId, type: 'component', config: def.defaultConfig })}
          >
            <Card.Meta title={def.label} description={def.description} />
          </Card>
        ))}
      </div>
    </Drawer>
  );
}
