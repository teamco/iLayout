// src/layout/hooks/useLayoutNode.ts
import { useLayoutStore } from '../store/layoutStore';
import { findNode } from '../utils/treeUtils';
import type { SplitterNode } from '../types';

export function useLayoutNode(id: string) {
  return useLayoutStore((state) => {
    const result = findNode(state.root, id);
    return result
      ? {
          node: result.node,
          parent: result.parent as SplitterNode | null,
          index: result.index,
        }
      : null;
  });
}
