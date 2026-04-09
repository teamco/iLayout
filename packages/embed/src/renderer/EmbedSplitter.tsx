import type { SplitterNode } from '../types';
import { renderNode } from './EmbedLayoutRenderer';

type Props = { node: SplitterNode };

export function EmbedSplitter({ node }: Props) {
  const direction = node.direction === 'horizontal' ? 'row' : 'column';

  return (
    <div
      className={`al-splitter al-splitter--${node.direction}`}
      style={{ display: 'flex', flexDirection: direction, width: '100%', height: '100%' }}
    >
      {node.children.map((child, i) => (
        <div
          key={child.id}
          className="al-panel"
          style={{ flexBasis: `${node.sizes[i]}%`, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
        >
          {renderNode(child)}
        </div>
      ))}
    </div>
  );
}
