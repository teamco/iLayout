import type { ScrollRoot, SectionNode } from '../types';
import { renderNode } from './renderNode';

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

type Props = { root: ScrollRoot };

export function EmbedScrollLayout({ root }: Props) {
  return (
    <div className="al-scroll">
      {root.sections.map((section) => (
        <div
          key={section.id}
          className="al-section"
          style={getSectionStyle(section)}
        >
          {renderNode(section.child)}
        </div>
      ))}
    </div>
  );
}
