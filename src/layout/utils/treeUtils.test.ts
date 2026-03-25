import { describe, it, expect } from 'vitest';
import { findNode, getDepth, splitNode, removeNode } from './treeUtils';
import type { LayoutNode, SplitterNode } from '../types';

const leaf = (id: string): LayoutNode => ({ id, type: 'leaf' });

const h = (id: string, children: LayoutNode[], sizes?: number[]): SplitterNode => ({
  id,
  type: 'splitter',
  direction: 'horizontal',
  sizes: sizes ?? children.map(() => 100 / children.length),
  children,
});

describe('findNode', () => {
  it('finds root leaf', () => {
    const root = leaf('a');
    expect(findNode(root, 'a')).toEqual({ node: root, parent: null, index: -1 });
  });

  it('finds nested leaf', () => {
    const a = leaf('a');
    const b = leaf('b');
    const root = h('root', [a, b]);
    const result = findNode(root, 'b');
    expect(result?.node).toBe(b);
    expect(result?.parent).toBe(root);
    expect(result?.index).toBe(1);
  });

  it('returns null for missing id', () => {
    expect(findNode(leaf('a'), 'x')).toBeNull();
  });
});

describe('getDepth', () => {
  it('returns 0 for root leaf', () => {
    expect(getDepth(leaf('a'), leaf('a'))).toBe(0);
  });

  it('returns 1 for direct child of splitter root', () => {
    const a = leaf('a');
    const root = h('root', [a, leaf('b')]);
    expect(getDepth(a, root)).toBe(1);
  });

  it('returns 2 for grandchild', () => {
    const a = leaf('a');
    const mid = h('mid', [a, leaf('b')]);
    const root = h('root', [mid, leaf('c')]);
    expect(getDepth(a, root)).toBe(2);
  });
});

describe('splitNode', () => {
  it('wraps lone leaf in horizontal splitter when splitting right', () => {
    const root = leaf('a');
    const result = splitNode(root, root, 'right', 'new');
    expect(result.type).toBe('splitter');
    const s = result as SplitterNode;
    expect(s.direction).toBe('horizontal');
    expect(s.children).toHaveLength(2);
    expect(s.children[0].id).toBe('a');
    expect(s.children[1].id).toBe('new');
    expect(s.sizes).toEqual([50, 50]);
  });

  it('inserts sibling when parent direction matches', () => {
    const a = leaf('a');
    const b = leaf('b');
    const root = h('root', [a, b], [60, 40]);
    const result = splitNode(root, a, 'right', 'c') as SplitterNode;
    expect(result.children.map(n => n.id)).toEqual(['a', 'c', 'b']);
    expect(result.sizes).toEqual([30, 30, 40]);
  });

  it('wraps leaf in vertical splitter when splitting bottom', () => {
    const a = leaf('a');
    const b = leaf('b');
    const root = h('root', [a, b]);
    const result = splitNode(root, a, 'bottom', 'c') as SplitterNode;
    const aWrapper = result.children[0] as SplitterNode;
    expect(aWrapper.type).toBe('splitter');
    expect(aWrapper.direction).toBe('vertical');
    expect(aWrapper.children.map(n => n.id)).toEqual(['a', 'c']);
  });
});

describe('removeNode', () => {
  it('removes a child and redistributes sizes', () => {
    const a = leaf('a');
    const b = leaf('b');
    const c = leaf('c');
    const root = h('root', [a, b, c], [30, 40, 30]);
    const result = removeNode(root, 'b') as SplitterNode;
    expect(result.children.map(n => n.id)).toEqual(['a', 'c']);
    expect(result.sizes).toEqual([50, 50]);
  });

  it('collapses splitter to surviving child when 2 → 1', () => {
    const a = leaf('a');
    const b = leaf('b');
    const root = h('root', [a, b]);
    const result = removeNode(root, 'b');
    expect(result.type).toBe('leaf');
    expect(result.id).toBe('a');
  });

  it('collapses recursively', () => {
    const a = leaf('a');
    const b = leaf('b');
    const inner = h('inner', [a, b]);
    const outer = h('outer', [inner, leaf('c')]);
    const result = removeNode(outer, 'b') as SplitterNode;
    expect(result.children.map(n => n.id)).toEqual(['a', 'c']);
  });
});
