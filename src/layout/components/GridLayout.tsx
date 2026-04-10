// src/layout/components/GridLayout.tsx
import type { GridRoot } from '@/layout/types';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { renderNode } from './LayoutRenderer';
import { ScrollLayout } from './ScrollLayout';
import { GridColumnHandle } from './GridColumnHandle';
import styles from './GridLayout.module.less';

type Props = { root: GridRoot };

export function GridLayout({ root }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);

  const templateColumns = root.columns.map((col) => col.size).join(' ');

  return (
    <div className={styles.grid} style={{ gridTemplateColumns: templateColumns }}>
      {root.columns.map((col, i) => (
        <div key={col.id} className={styles.column}>
          {col.child.type === 'scroll' ? (
            <ScrollLayout root={col.child as unknown as ScrollRoot} />
          ) : (
            renderNode(col.child)
          )}
          {editMode && i < root.columns.length - 1 && (
            <GridColumnHandle
              leftColumnId={col.id}
              rightColumnId={root.columns[i + 1].id}
            />
          )}
        </div>
      ))}
    </div>
  );
}
