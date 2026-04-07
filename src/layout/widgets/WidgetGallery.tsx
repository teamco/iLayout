// src/layout/widgets/WidgetGallery.tsx
import clsx from 'clsx';
import { Drawer, Card, Typography } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { getAllWidgets, type WidgetDefinition } from './widgetRegistry';
import type { WidgetRef } from '@/layout/types';
import styles from './WidgetGallery.module.less';

type Props = {
  open: boolean;
  onSelect: (widget: WidgetRef) => void;
  onClose: () => void;
};

function DraggableWidgetCard({ def, onSelect }: { def: WidgetDefinition; onSelect: (w: WidgetRef) => void }) {
  const widgetRef: WidgetRef = {
    widgetId: def.widgetId,
    resource: def.defaultType ?? 'component',
    content: { value: '' },
    config: def.defaultConfig,
  };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gallery-${def.widgetId}`,
    data: { type: 'gallery', widgetRef },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(styles.cardWrapper, { [styles.dragging]: isDragging })}
    >
      <Card size="small" hoverable onClick={() => onSelect(widgetRef)}>
        <Typography.Text strong>{def.label}</Typography.Text>
        {def.description && (
          <Typography.Text type="secondary" className={styles.cardDescription}>
            {def.description}
          </Typography.Text>
        )}
      </Card>
    </div>
  );
}

export function WidgetGallery({ open, onSelect, onClose }: Props) {
  const widgets = getAllWidgets();
  return (
    <Drawer title="Widget Gallery" open={open} onClose={onClose} size="default">
      <div className={styles.list}>
        {widgets.map(def => (
          <DraggableWidgetCard key={def.widgetId} def={def} onSelect={onSelect} />
        ))}
      </div>
    </Drawer>
  );
}
