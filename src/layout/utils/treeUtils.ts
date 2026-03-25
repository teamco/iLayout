import type { LayoutNode, SplitterNode, SplitDirection } from '../types';

type FindResult = { node: LayoutNode; parent: SplitterNode | null; index: number };

export function findNode(root: LayoutNode, id: string): FindResult | null {
  if (root.id === id) return { node: root, parent: null, index: -1 };
  if (root.type !== 'splitter') return null;
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.id === id) return { node: child, parent: root, index: i };
    const nested = findNode(child, id);
    if (nested) return nested;
  }
  return null;
}
export function getDepth(target: LayoutNode, root: LayoutNode): number {
  function walk(node: LayoutNode, depth: number): number | null {
    if (node.id === target.id) return depth;
    if (node.type !== 'splitter') return null;
    for (const child of node.children) {
      const d = walk(child, depth + 1);
      if (d !== null) return d;
    }
    return null;
  }
  return walk(root, 0) ?? 0;
}
export function updateNode(
  root: LayoutNode,
  id: string,
  fn: (node: LayoutNode) => LayoutNode,
): LayoutNode {
  if (root.id === id) return fn(root);
  if (root.type !== 'splitter') return root;
  return {
    ...root,
    children: root.children.map(child => updateNode(child, id, fn)),
  };
}
function directionAxis(dir: SplitDirection): 'horizontal' | 'vertical' {
  return dir === 'left' || dir === 'right' ? 'horizontal' : 'vertical';
}

function insertAfter(dir: SplitDirection): boolean {
  return dir === 'right' || dir === 'bottom';
}

export function splitNode(
  root: LayoutNode,
  target: LayoutNode,
  direction: SplitDirection,
  newId: string,
  wrapperId: string,
): LayoutNode {
  const newLeaf: LayoutNode = { id: newId, type: 'leaf' };
  const axis = directionAxis(direction);
  const after = insertAfter(direction);
  const found = target.id === root.id
    ? { node: target, parent: null as SplitterNode | null, index: -1 }
    : findNode(root, target.id);

  if (!found) return root;

  const { parent } = found;

  if (parent && parent.direction === axis) {
    return updateNode(root, parent.id, (p) => {
      const s = p as SplitterNode;
      const idx = s.children.findIndex(c => c.id === target.id);
      const insertIdx = after ? idx + 1 : idx;
      const newSizes = [...s.sizes];
      const half = newSizes[idx] / 2;
      newSizes[idx] = half;
      newSizes.splice(insertIdx, 0, half);
      const newChildren = [...s.children];
      newChildren.splice(insertIdx, 0, newLeaf);
      return { ...s, children: newChildren, sizes: newSizes };
    });
  }

  const wrapper: SplitterNode = {
    id: wrapperId,
    type: 'splitter',
    direction: axis,
    sizes: [50, 50],
    children: after ? [target, newLeaf] : [newLeaf, target],
  };

  if (!parent) return wrapper;

  return updateNode(root, parent.id, (p) => {
    const s = p as SplitterNode;
    const idx = s.children.findIndex(c => c.id === target.id);
    const newChildren = [...s.children];
    newChildren[idx] = wrapper;
    return { ...s, children: newChildren };
  });
}
export function removeNode(root: LayoutNode, id: string): LayoutNode {
  if (root.type !== 'splitter') return root;

  const idx = root.children.findIndex(c => c.id === id);
  if (idx !== -1) {
    const removed = root.sizes[idx];
    const remaining = root.sizes.filter((_, i) => i !== idx);
    const share = removed / remaining.length;
    const newSizes = remaining.map(s => s + share);
    const newChildren = root.children.filter(c => c.id !== id);

    if (newChildren.length === 1) return newChildren[0];

    return { ...root, children: newChildren, sizes: newSizes };
  }

  const newChildren = root.children.map(child => removeNode(child, id));
  const collapsed = newChildren.map(child =>
    child.type === 'splitter' && child.children.length === 1
      ? child.children[0]
      : child,
  );
  return { ...root, children: collapsed };
}
