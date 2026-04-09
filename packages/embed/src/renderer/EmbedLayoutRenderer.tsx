import type { LayoutNode, ScrollRoot } from '../types';
import { EmbedSplitter } from './EmbedSplitter';
import { EmbedLeaf } from './EmbedLeaf';
import { EmbedScrollLayout } from './EmbedScrollLayout';

export function renderNode(node: LayoutNode): React.ReactNode {
  switch (node.type) {
    case 'splitter':
      return <EmbedSplitter key={node.id} node={node} />;
    case 'leaf':
      return <EmbedLeaf key={node.id} node={node} />;
    case 'scroll':
      return <EmbedScrollLayout key={node.id} root={node as ScrollRoot} />;
    case 'section':
      return renderNode(node.child);
  }
}

type Props = { root: LayoutNode };

export function EmbedLayoutRenderer({ root }: Props) {
  return <>{renderNode(root)}</>;
}
