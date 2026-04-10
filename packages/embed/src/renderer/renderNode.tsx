import type { LayoutNode, ScrollRoot, GridRoot } from '../types';
import { EmbedSplitter } from './EmbedSplitter';
import { EmbedLeaf } from './EmbedLeaf';
import { EmbedScrollLayout } from './EmbedScrollLayout';
import { EmbedGridLayout } from './EmbedGridLayout';

export function renderNode(node: LayoutNode): React.ReactNode {
  switch (node.type) {
    case 'splitter':
      return <EmbedSplitter key={node.id} node={node} />;
    case 'leaf':
      return <EmbedLeaf key={node.id} node={node} />;
    case 'grid':
      return <EmbedGridLayout key={node.id} root={node as GridRoot} />;
    case 'scroll':
      return <EmbedScrollLayout key={node.id} root={node as ScrollRoot} />;
    case 'section':
      return renderNode(node.child);
  }
}
