// src/layout/store/layoutStore.ts
import { create, createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import {
  splitNode,
  removeNode,
  updateNode,
  findNode,
} from '../utils/treeUtils';
import type {
  LayoutNode,
  SplitDirection,
  WidgetRef,
  LayoutMode,
  SectionNode,
  SectionHeight,
  ScrollRoot,
} from '../types';

export type LayoutState = {
  root: LayoutNode;
  editMode: boolean;
  activeWidgetEditId: string | null;
  galleryTargetId: string | null;
  maxDepth: number;
  showGrid: boolean;
  layoutMode: LayoutMode;
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
  setGalleryTarget: (id: string | null) => void;
  toggleGrid: () => void;
  setLayoutMode: (mode: LayoutMode) => void;
  addSection: (position: 'before' | 'after', targetSectionId: string) => void;
  removeSection: (sectionId: string) => void;
  resizeSection: (sectionId: string, height: SectionHeight) => void;
  updateSectionConfig: (
    sectionId: string,
    config: Partial<Pick<SectionNode, 'overlap' | 'zIndex'>>,
  ) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
};

export type LayoutStore = LayoutState & LayoutActions;

function makeInitialRoot(): LayoutNode {
  return { id: nanoid(), type: 'leaf' };
}

function makeActions(
  set: (fn: (state: LayoutStore) => void) => void,
): LayoutActions {
  return {
    addPanel(targetId, direction) {
      set((state) => {
        const found = findNode(state.root, targetId);
        if (!found) return;
        state.root = splitNode(
          state.root,
          found.node,
          direction,
          nanoid(),
          nanoid(),
        );
      });
    },
    removePanel(id) {
      set((state) => {
        state.root = removeNode(state.root, id);
      });
    },
    setWidget(leafId, widget) {
      set((state) => {
        state.root = updateNode(state.root, leafId, (n) => ({ ...n, widget }));
      });
    },
    clearWidget(leafId) {
      set((state) => {
        state.root = updateNode(state.root, leafId, (n) => {
          if (n.type !== 'leaf') return n;
          return { id: n.id, type: 'leaf' };
        });
      });
    },
    swapWidgets(idA, idB) {
      set((state) => {
        const nodeA = findNode(state.root, idA)?.node;
        const nodeB = findNode(state.root, idB)?.node;
        const wA = nodeA?.type === 'leaf' ? nodeA.widget : undefined;
        const wB = nodeB?.type === 'leaf' ? nodeB.widget : undefined;
        state.root = updateNode(state.root, idA, (n) => ({ ...n, widget: wB }));
        state.root = updateNode(state.root, idB, (n) => ({ ...n, widget: wA }));
      });
    },
    resize(splitterId, sizes) {
      set((state) => {
        state.root = updateNode(state.root, splitterId, (n) => ({
          ...n,
          sizes,
        }));
      });
    },
    setEditMode(on) {
      set((state) => {
        state.editMode = on;
        if (!on) {
          state.showGrid = false;
          state.activeWidgetEditId = null;
          state.galleryTargetId = null;
        }
      });
    },
    setActiveWidgetEdit(id) {
      set((state) => {
        state.activeWidgetEditId = id;
      });
    },
    setGalleryTarget(id) {
      set((state) => {
        state.galleryTargetId = id;
      });
    },
    toggleGrid() {
      set((state) => {
        if (!state.editMode) return;
        state.showGrid = !state.showGrid;
      });
    },

    setLayoutMode(mode) {
      set((state) => {
        if (mode === 'scroll' && state.root.type !== 'scroll') {
          const section: SectionNode = {
            id: nanoid(),
            type: 'section',
            height: { type: 'fixed', value: '100vh' },
            child: state.root,
          };
          state.root = {
            id: nanoid(),
            type: 'scroll',
            sections: [section],
          } as unknown as LayoutNode;
        } else if (mode === 'viewport' && state.root.type === 'scroll') {
          const scrollRoot = state.root as unknown as ScrollRoot;
          state.root = scrollRoot.sections[0]?.child ?? {
            id: nanoid(),
            type: 'leaf',
          };
        }
        state.layoutMode = mode;
      });
    },

    addSection(position, targetSectionId) {
      set((state) => {
        if (state.root.type !== 'scroll') return;
        const scrollRoot = state.root as unknown as ScrollRoot;
        const idx = scrollRoot.sections.findIndex(
          (s) => s.id === targetSectionId,
        );
        if (idx === -1) return;
        const newSection: SectionNode = {
          id: nanoid(),
          type: 'section',
          height: { type: 'min', value: '200px' },
          child: { id: nanoid(), type: 'leaf' },
        };
        const insertAt = position === 'before' ? idx : idx + 1;
        scrollRoot.sections.splice(insertAt, 0, newSection);
      });
    },

    removeSection(sectionId) {
      set((state) => {
        if (state.root.type !== 'scroll') return;
        const scrollRoot = state.root as unknown as ScrollRoot;
        if (scrollRoot.sections.length <= 1) return;
        scrollRoot.sections = scrollRoot.sections.filter(
          (s) => s.id !== sectionId,
        );
      });
    },

    resizeSection(sectionId, height) {
      set((state) => {
        if (state.root.type !== 'scroll') return;
        const scrollRoot = state.root as unknown as ScrollRoot;
        const section = scrollRoot.sections.find((s) => s.id === sectionId);
        if (section) section.height = height;
      });
    },

    updateSectionConfig(sectionId, config) {
      set((state) => {
        if (state.root.type !== 'scroll') return;
        const scrollRoot = state.root as unknown as ScrollRoot;
        const section = scrollRoot.sections.find((s) => s.id === sectionId);
        if (!section) return;
        if (config.overlap !== undefined) section.overlap = config.overlap;
        if (config.zIndex !== undefined) section.zIndex = config.zIndex;
      });
    },

    reorderSections(fromIndex, toIndex) {
      set((state) => {
        if (state.root.type !== 'scroll') return;
        const scrollRoot = state.root as unknown as ScrollRoot;
        const [moved] = scrollRoot.sections.splice(fromIndex, 1);
        scrollRoot.sections.splice(toIndex, 0, moved);
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
      galleryTargetId: null,
      maxDepth: 5,
      showGrid: false,
      layoutMode: 'viewport',
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
    galleryTargetId: null,
    maxDepth: 5,
    showGrid: false,
    layoutMode: 'viewport',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...makeActions(set as any),
  })),
);
