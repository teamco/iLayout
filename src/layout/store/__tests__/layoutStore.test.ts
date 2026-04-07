// src/layout/store/layoutStore.test.ts
import { describe, it, expect } from 'vitest';
import { act } from '@testing-library/react';
import { createLayoutStore } from '../layoutStore';
import type { SplitterNode, LeafNode } from '../../types';
import type { ScrollRoot } from '../../types';

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

describe('layout modes', () => {
  it('defaults to viewport mode', () => {
    const store = createLayoutStore();
    expect(store.getState().layoutMode).toBe('viewport');
  });

  it('switches to scroll mode wrapping root in a section', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    expect(store.getState().layoutMode).toBe('scroll');
    expect(store.getState().root.type).toBe('scroll');
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    expect(scrollRoot.sections).toHaveLength(1);
    expect(scrollRoot.sections[0].type).toBe('section');
    expect(scrollRoot.sections[0].height).toEqual({ type: 'fixed', value: '100vh' });
  });

  it('switches back to viewport taking first section child', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    act(() => store.getState().setLayoutMode('viewport'));
    expect(store.getState().layoutMode).toBe('viewport');
    expect(store.getState().root.type).toBe('leaf');
  });

  it('adds a section before target', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('before', firstId));
    const updated = store.getState().root as unknown as ScrollRoot;
    expect(updated.sections).toHaveLength(2);
    expect(updated.sections[1].id).toBe(firstId);
  });

  it('adds a section after target', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    const updated = store.getState().root as unknown as ScrollRoot;
    expect(updated.sections).toHaveLength(2);
    expect(updated.sections[0].id).toBe(firstId);
  });

  it('removes a section (keeps at least one)', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    const twoSections = store.getState().root as unknown as ScrollRoot;
    expect(twoSections.sections).toHaveLength(2);
    act(() => store.getState().removeSection(twoSections.sections[1].id));
    expect((store.getState().root as unknown as ScrollRoot).sections).toHaveLength(1);
    // Cannot remove last section
    act(() => store.getState().removeSection(firstId));
    expect((store.getState().root as unknown as ScrollRoot).sections).toHaveLength(1);
  });

  it('resizes a section', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const sectionId = scrollRoot.sections[0].id;
    act(() => store.getState().resizeSection(sectionId, { type: 'fixed', value: '500px' }));
    const updated = store.getState().root as unknown as ScrollRoot;
    expect(updated.sections[0].height).toEqual({ type: 'fixed', value: '500px' });
  });

  it('updates section config (overlap, zIndex)', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const sectionId = scrollRoot.sections[0].id;
    act(() => store.getState().updateSectionConfig(sectionId, { overlap: '-30px', zIndex: 5 }));
    const updated = store.getState().root as unknown as ScrollRoot;
    expect(updated.sections[0].overlap).toBe('-30px');
    expect(updated.sections[0].zIndex).toBe(5);
  });

  it('reorders sections', () => {
    const store = createLayoutStore();
    act(() => store.getState().setLayoutMode('scroll'));
    const scrollRoot = store.getState().root as unknown as ScrollRoot;
    const firstId = scrollRoot.sections[0].id;
    act(() => store.getState().addSection('after', firstId));
    act(() => store.getState().addSection('after', firstId));
    const three = store.getState().root as unknown as ScrollRoot;
    const ids = three.sections.map(s => s.id);
    act(() => store.getState().reorderSections(0, 2));
    const reordered = store.getState().root as unknown as ScrollRoot;
    expect(reordered.sections[2].id).toBe(ids[0]);
  });
});
