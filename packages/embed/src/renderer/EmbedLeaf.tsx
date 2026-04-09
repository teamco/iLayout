import type { LeafNode } from '../types';
import { EmbedWidgetRenderer } from './EmbedWidgetRenderer';

type Props = { node: LeafNode };

export function EmbedLeaf({ node }: Props) {
  return (
    <div className="al-leaf">
      {node.widget ? (
        <EmbedWidgetRenderer widget={node.widget} />
      ) : (
        <div className="al-widget-empty" />
      )}
    </div>
  );
}
