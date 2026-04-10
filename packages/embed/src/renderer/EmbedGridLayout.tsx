import type { GridRoot, ScrollRoot, SectionNode } from '../types';
import { renderNode } from './renderNode';
import { EmbedScrollLayout } from './EmbedScrollLayout';

function getSectionStyle(section: SectionNode): React.CSSProperties {
  const style: React.CSSProperties = { width: '100%', position: 'relative' };
  switch (section.height.type) {
    case 'fixed':
      style.height = section.height.value;
      break;
    case 'min':
      style.height = section.height.value;
      break;
    default:
      break;
  }
  if (section.overlap) style.marginTop = section.overlap;
  if (section.zIndex) style.zIndex = section.zIndex;
  return style;
}

type Props = { root: GridRoot };

export function EmbedGridLayout({ root }: Props) {
  // Split columns: find scroll (center) column
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
    <div
      className="al-grid-outer"
      style={{ display: 'flex', width: '100%', minHeight: '100vh' }}
    >
      {leftSidebars.map((col) => (
        <div
          key={col.id}
          className="al-grid-sidebar"
          style={{
            width: col.size,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {renderNode(col.child)}
        </div>
      ))}

      <div className="al-grid-center" style={{ flex: 1, minWidth: 0 }}>
        {root.headerSections?.map((section) => (
          <div
            key={section.id}
            className="al-section"
            style={getSectionStyle(section)}
          >
            {renderNode(section.child)}
          </div>
        ))}
        {centerColumns.map((col) =>
          col.child.type === 'scroll' ? (
            <EmbedScrollLayout key={col.id} root={col.child as ScrollRoot} />
          ) : (
            renderNode(col.child)
          ),
        )}
        {root.footerSections?.map((section) => (
          <div
            key={section.id}
            className="al-section"
            style={getSectionStyle(section)}
          >
            {renderNode(section.child)}
          </div>
        ))}
      </div>

      {rightSidebars.map((col) => (
        <div
          key={col.id}
          className="al-grid-sidebar"
          style={{
            width: col.size,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {renderNode(col.child)}
        </div>
      ))}
    </div>
  );
}
