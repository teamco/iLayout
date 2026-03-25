// src/layout/store/layoutStore.test.ts
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createLayoutStore } from './layoutStore';
import type { SplitterNode, LeafNode } from '../types';

describe('layoutStore', () => {
  it('adds a panel by splitting right', () => {
    const store = createLayoutStore();
    const rootId = store.getState().root.id;
    act(() => store.getState().addPanel(rootId, 'right'));
    const { root } = store.getState();
    expect(root.type).toBe('splitter');
  });

  it('removes a panel', () => {
    const store = createLayoutStore();
    const rootId = store.getState().root.id;
    act(() => store.getState().addPanel(rootId, 'right'));
    const splitter = store.getState().root as SplitterNode;
    const childId = splitter.children[1].id;
    act(() => store.getState().removePanel(childId));
    expect(store.getState().root.type).toBe('leaf');
  });

  it('sets a widget on a leaf', () => {
    const store = createLayoutStore();
    const rootId = store.getState().root.id;
    act(() => store.getState().setWidget(rootId, { widgetId: 'w1', type: 'component', config: {} }));
    const root = store.getState().root as LeafNode;
    expect(root.widget?.widgetId).toBe('w1');
  });

  it('swaps widgets between two leaves', () => {
    const store = createLayoutStore();
    const rootId = store.getState().root.id;
    act(() => store.getState().addPanel(rootId, 'right'));
    const { children } = store.getState().root as SplitterNode;
    act(() => store.getState().setWidget(children[0].id, { widgetId: 'A', type: 'component', config: {} }));
    act(() => store.getState().setWidget(children[1].id, { widgetId: 'B', type: 'component', config: {} }));
    act(() => store.getState().swapWidgets(children[0].id, children[1].id));
    const updated = store.getState().root as SplitterNode;
    expect((updated.children[0] as LeafNode).widget?.widgetId).toBe('B');
    expect((updated.children[1] as LeafNode).widget?.widgetId).toBe('A');
  });
});
