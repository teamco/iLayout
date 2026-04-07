// src/layout/widgets/WidgetGallery.tsx
import clsx from 'clsx';
import { Drawer, Card, Typography } from 'antd';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { getAllWidgetDefs } from '@/widgets/registry';
import type { WidgetDefinition } from '@/widgets/types';
import type { WidgetRef } from '@/layout/types';
import type { EWidgetResource } from '@/lib/types';
import styles from './WidgetGallery.module.less';

type Props = {
  open: boolean;
  onSelect: (widget: WidgetRef) => void;
  onClose: () => void;
};

function defToWidgetRef(def: WidgetDefinition): WidgetRef {
  return {
    widgetId: def.label,
    resource: def.resource as EWidgetResource,
    content: def.defaultContent,
    config: def.defaultConfig as Record<string, unknown>,
  };
}

function DraggableWidgetCard({ def, onSelect }: { def: WidgetDefinition; onSelect: (w: WidgetRef) => void }) {
  const widgetRef = defToWidgetRef(def);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `gallery-${def.resource}`,
    data: { type: 'gallery', widgetRef },
  });

  const Icon = def.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={clsx(styles.cardWrapper, { [styles.dragging]: isDragging })}
    >
      <Card size="small" hoverable onClick={() => onSelect(widgetRef)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon />
          <div>
            <Typography.Text strong>{def.label}</Typography.Text>
            {def.description && (
              <Typography.Text type="secondary" className={styles.cardDescription}>
                {def.description}
              </Typography.Text>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export function WidgetGallery({ open, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  const builtIn = getAllWidgetDefs();

  return (
    <Drawer title={t('profile.widgets')} open={open} onClose={onClose} size="default">
      <div className={styles.list}>
        {builtIn.map(def => (
          <DraggableWidgetCard key={def.resource} def={def} onSelect={onSelect} />
        ))}
      </div>
    </Drawer>
  );
}
