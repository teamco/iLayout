// src/layout/store/layoutStore.test.ts
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createLayoutStore } from '../layoutStore';
import type { SplitterNode, LeafNode } from '../../types';

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
    act(() => store.getState().setWidget(rootId, { widgetId: 'w1', resource: 'component', content: { value: '' }, config: {} }));
    const root = store.getState().root as LeafNode;
    expect(root.widget?.widgetId).toBe('w1');
  });

  it('swaps widgets between two leaves', () => {
    const store = createLayoutStore();
    const rootId = store.getState().root.id;
    act(() => store.getState().addPanel(rootId, 'right'));
    const { children } = store.getState().root as SplitterNode;
    act(() => store.getState().setWidget(children[0].id, { widgetId: 'A', resource: 'component', content: { value: '' }, config: {} }));
    act(() => store.getState().setWidget(children[1].id, { widgetId: 'B', resource: 'component', content: { value: '' }, config: {} }));
    act(() => store.getState().swapWidgets(children[0].id, children[1].id));
    const updated = store.getState().root as SplitterNode;
    expect((updated.children[0] as LeafNode).widget?.widgetId).toBe('B');
    expect((updated.children[1] as LeafNode).widget?.widgetId).toBe('A');
  });

  it('toggles showGrid', () => {
    const store = createLayoutStore();
    act(() => store.getState().setEditMode(true));
    expect(store.getState().showGrid).toBe(false);
    act(() => store.getState().toggleGrid());
    expect(store.getState().showGrid).toBe(true);
    act(() => store.getState().toggleGrid());
    expect(store.getState().showGrid).toBe(false);
  });

  it('resets showGrid when editMode is turned off', () => {
    const store = createLayoutStore();
    act(() => store.getState().setEditMode(true));
    act(() => store.getState().toggleGrid());
    expect(store.getState().showGrid).toBe(true);
    act(() => store.getState().setEditMode(false));
    expect(store.getState().showGrid).toBe(false);
  });

  it('does not toggle showGrid when editMode is off', () => {
    const store = createLayoutStore();
    expect(store.getState().editMode).toBe(false);
    act(() => store.getState().toggleGrid());
    expect(store.getState().showGrid).toBe(false);
  });
});
