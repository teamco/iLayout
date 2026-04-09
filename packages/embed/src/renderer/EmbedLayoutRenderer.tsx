import type { LayoutNode } from '../types';
import { renderNode } from './renderNode';

type Props = { root: LayoutNode };

export function EmbedLayoutRenderer({ root }: Props) {
  return <>{renderNode(root)}</>;
}
