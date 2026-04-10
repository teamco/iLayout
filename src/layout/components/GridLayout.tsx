// src/layout/components/GridLayout.tsx
import { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import type { GridRoot, GridColumn, SectionNode } from '@/layout/types';
import type { ScrollRoot } from '@/layout/types';
import { useLayoutStore } from '@/layout/store/layoutStore';
import { renderNode } from './LayoutRenderer';
import { ScrollLayout } from './ScrollLayout';
import { SectionNodeComponent } from './SectionNodeComponent';
import { SectionHandle } from './SectionHandle';
import { SectionConfig } from './SectionConfig';
import { GridColumnHandle } from './GridColumnHandle';
import styles from './GridLayout.module.less';

function FullWidthSection({
  section,
  onConfig,
}: {
  section: SectionNode;
  onConfig: (id: string) => void;
}) {
  const editMode = useLayoutStore((s) => s.editMode);
  return (
    <div>
      <SectionNodeComponent section={section} onConfig={onConfig} />
      {editMode && <SectionHandle aboveSectionId={section.id} />}
    </div>
  );
}

function ColumnContent({ col }: { col: GridColumn }) {
  if (col.child.type === 'scroll') {
    return <ScrollLayout root={col.child as unknown as ScrollRoot} />;
  }
  return <>{renderNode(col.child)}</>;
}

function SidebarCloseButton({ columnId }: { columnId: string }) {
  const removeGridColumn = useLayoutStore((s) => s.removeGridColumn);
  return (
    <Tooltip title="Remove column">
      <Button
        size="small"
        danger
        icon={<CloseOutlined />}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          zIndex: 10,
          opacity: 0.6,
        }}
        onClick={() => removeGridColumn(columnId)}
      />
    </Tooltip>
  );
}

type Props = { root: GridRoot };

export function GridLayout({ root }: Props) {
  const editMode = useLayoutStore((s) => s.editMode);
  const [configSectionId, setConfigSectionId] = useState<string | null>(null);

  // Split columns: find the scroll (center) column index
  const scrollIdx = root.columns.findIndex((c) => c.child.type === 'scroll');
  const leftSidebars = scrollIdx > 0 ? root.columns.slice(0, scrollIdx) : [];
  const centerColumns =
    scrollIdx >= 0
      ? [root.columns[scrollIdx]]
      : root.columns.filter((c) => c.size.includes('fr'));
  const rightSidebars =
    scrollIdx >= 0
      ? root.columns.slice(scrollIdx + 1)
      : root.columns.filter((c) => !c.size.includes('fr'));

  return (
    <div className={styles.outer}>
      {/* Left sidebars — full page height */}
      {leftSidebars.map((col, i) => (
        <div
          key={col.id}
          className={styles.sidebar}
          style={{ width: col.size }}
        >
          {editMode && <SidebarCloseButton columnId={col.id} />}
          <ColumnContent col={col} />
          {editMode && (
            <GridColumnHandle
              leftColumnId={col.id}
              rightColumnId={
                leftSidebars[i + 1]?.id ?? centerColumns[0]?.id ?? col.id
              }
            />
          )}
        </div>
      ))}

      {/* Center: header + scroll sections + footer */}
      <div className={styles.center}>
        {root.headerSections?.map((section) => (
          <FullWidthSection
            key={section.id}
            section={section}
            onConfig={setConfigSectionId}
          />
        ))}
        {centerColumns.map((col) => (
          <ColumnContent key={col.id} col={col} />
        ))}
        {root.footerSections?.map((section) => (
          <FullWidthSection
            key={section.id}
            section={section}
            onConfig={setConfigSectionId}
          />
        ))}
      </div>

      {/* Right sidebars — full page height */}
      {rightSidebars.map((col, i) => (
        <div
          key={col.id}
          className={styles.sidebar}
          style={{ width: col.size }}
        >
          {editMode && <SidebarCloseButton columnId={col.id} />}
          {editMode && i === 0 && centerColumns[0] && (
            <GridColumnHandle
              leftColumnId={centerColumns[0].id}
              rightColumnId={col.id}
            />
          )}
          <ColumnContent col={col} />
          {editMode && i < rightSidebars.length - 1 && (
            <GridColumnHandle
              leftColumnId={col.id}
              rightColumnId={rightSidebars[i + 1].id}
            />
          )}
        </div>
      ))}

      <SectionConfig
        open={configSectionId !== null}
        sectionId={configSectionId}
        onClose={() => setConfigSectionId(null)}
      />
    </div>
  );
}
