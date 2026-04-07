// src/layout/store/layoutStore.ts
import { create, createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import { splitNode, removeNode, updateNode, findNode } from '../utils/treeUtils';
import type { LayoutNode, SplitDirection, WidgetRef } from '../types';

export type LayoutState = {
  root: LayoutNode;
  editMode: boolean;
  activeWidgetEditId: string | null;
  maxDepth: number;
  showGrid: boolean;
};

export type LayoutActions = {
  addPanel: (targetId: string, direction: SplitDirection) => void;
  removePanel: (id: string) => void;
  setWidget: (leafId: string, widget: WidgetRef) => void;
  clearWidget: (leafId: string) => void;
  swapWidgets: (idA: string, idB: string) => void;
  resize: (splitterId: string, sizes: number[]) => void;
  setEditMode: (on: boolean) => void;
  setActiveWidgetEdit: (id: string | null) => void;
  toggleGrid: () => void;
};

export type LayoutStore = LayoutState & LayoutActions;

function makeInitialRoot(): LayoutNode {
  return { id: nanoid(), type: 'leaf' };
}

function makeActions(set: (fn: (state: LayoutStore) => void) => void): LayoutActions {
  return {
    addPanel(targetId, direction) {
      set(state => {
        const found = findNode(state.root, targetId);
        if (!found) return;
        state.root = splitNode(state.root, found.node, direction, nanoid(), nanoid());
      });
    },
    removePanel(id) {
      set(state => { state.root = removeNode(state.root, id); });
    },
    setWidget(leafId, widget) {
      set(state => { state.root = updateNode(state.root, leafId, n => ({ ...n, widget })); });
    },
    clearWidget(leafId) {
      set(state => {
        state.root = updateNode(state.root, leafId, n => {
          if (n.type !== 'leaf') return n;
          return { id: n.id, type: 'leaf' };
        });
      });
    },
    swapWidgets(idA, idB) {
      set(state => {
        const nodeA = findNode(state.root, idA)?.node;
        const nodeB = findNode(state.root, idB)?.node;
        const wA = nodeA?.type === 'leaf' ? nodeA.widget : undefined;
        const wB = nodeB?.type === 'leaf' ? nodeB.widget : undefined;
        state.root = updateNode(state.root, idA, n => ({ ...n, widget: wB }));
        state.root = updateNode(state.root, idB, n => ({ ...n, widget: wA }));
      });
    },
    resize(splitterId, sizes) {
      set(state => { state.root = updateNode(state.root, splitterId, n => ({ ...n, sizes })); });
    },
    setEditMode(on) {
      set(state => {
        state.editMode = on;
        if (!on) state.showGrid = false;
      });
    },
    setActiveWidgetEdit(id) { set(state => { state.activeWidgetEditId = id; }); },
    toggleGrid() {
      set(state => {
        if (!state.editMode) return;
        state.showGrid = !state.showGrid;
      });
    },
  };
}

/** Factory for testing — creates an isolated store instance */
export function createLayoutStore(initialRoot?: LayoutNode) {
  return createStore<LayoutStore>()(
    immer((set) => ({
      root: initialRoot ?? makeInitialRoot(),
      editMode: false,
      activeWidgetEditId: null,
      maxDepth: 5,
      showGrid: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...makeActions(set as any),
    })),
  );
}

/** Singleton store for app use */
export const useLayoutStore = create<LayoutStore>()(
  immer((set) => ({
    root: makeInitialRoot(),
    editMode: false,
    activeWidgetEditId: null,
    maxDepth: 5,
    showGrid: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...makeActions(set as any),
  })),
);
