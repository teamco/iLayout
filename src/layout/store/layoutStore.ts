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
  GridRoot,
  GridColumn,
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
  addGridColumn: (position: 'left' | 'right', size?: string) => void;
  removeGridColumn: (columnId: string) => void;
  addGridSection: (position: 'top' | 'bottom') => void;
  resizeGridColumn: (columnId: string, size: string) => void;
};

export type LayoutStore = LayoutState & LayoutActions;

function makeInitialRoot(): LayoutNode {
  return { id: nanoid(), type: 'leaf' };
}

function makeActions(
  set: (fn: (state: LayoutStore) => void) => void,
): LayoutActions {
  function getScrollRoot(state: LayoutStore): ScrollRoot | null {
    if (state.root.type === 'scroll')
      return state.root as unknown as ScrollRoot;
    if (state.root.type === 'grid') {
      const grid = state.root as unknown as GridRoot;
      for (const col of grid.columns) {
        if (col.child.type === 'scroll')
          return col.child as unknown as ScrollRoot;
      }
    }
    return null;
  }

  function findGridSection(
    state: LayoutStore,
    sectionId: string,
  ): SectionNode | null {
    if (state.root.type !== 'grid') return null;
    const grid = state.root as unknown as GridRoot;
    for (const s of [
      ...(grid.headerSections ?? []),
      ...(grid.footerSections ?? []),
    ]) {
      if (s.id === sectionId) return s;
    }
    return null;
  }

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
        if (
          mode === 'scroll' &&
          state.root.type !== 'scroll' &&
          state.root.type !== 'grid'
        ) {
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
        } else if (mode === 'viewport') {
          if (state.root.type === 'grid') {
            const grid = state.root as unknown as GridRoot;
            const scrollCol = grid.columns.find(
              (c) => c.child.type === 'scroll',
            );
            const scrollRoot = scrollCol?.child as unknown as
              | ScrollRoot
              | undefined;
            state.root = scrollRoot?.sections[0]?.child ?? {
              id: nanoid(),
              type: 'leaf',
            };
          } else if (state.root.type === 'scroll') {
            const scrollRoot = state.root as unknown as ScrollRoot;
            state.root = scrollRoot.sections[0]?.child ?? {
              id: nanoid(),
              type: 'leaf',
            };
          }
        }
        state.layoutMode = mode;
      });
    },

    addSection(position, targetSectionId) {
      set((state) => {
        const scrollRoot = getScrollRoot(state);
        if (!scrollRoot) return;
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
        // Check grid header/footer sections first
        if (state.root.type === 'grid') {
          const grid = state.root as unknown as GridRoot;
          if (grid.headerSections?.some((s) => s.id === sectionId)) {
            grid.headerSections = grid.headerSections.filter(
              (s) => s.id !== sectionId,
            );
            return;
          }
          if (grid.footerSections?.some((s) => s.id === sectionId)) {
            grid.footerSections = grid.footerSections.filter(
              (s) => s.id !== sectionId,
            );
            return;
          }
        }
        const scrollRoot = getScrollRoot(state);
        if (!scrollRoot) return;
        if (scrollRoot.sections.length <= 1) return;
        scrollRoot.sections = scrollRoot.sections.filter(
          (s) => s.id !== sectionId,
        );
      });
    },

    resizeSection(sectionId, height) {
      set((state) => {
        const gridSection = findGridSection(state, sectionId);
        if (gridSection) {
          gridSection.height = height;
          return;
        }
        const scrollRoot = getScrollRoot(state);
        if (!scrollRoot) return;
        const section = scrollRoot.sections.find((s) => s.id === sectionId);
        if (section) section.height = height;
      });
    },

    updateSectionConfig(sectionId, config) {
      set((state) => {
        const gridSection = findGridSection(state, sectionId);
        const section =
          gridSection ??
          getScrollRoot(state)?.sections.find((s) => s.id === sectionId);
        if (!section) return;
        if (config.overlap !== undefined) section.overlap = config.overlap;
        if (config.zIndex !== undefined) section.zIndex = config.zIndex;
      });
    },

    reorderSections(fromIndex, toIndex) {
      set((state) => {
        const scrollRoot = getScrollRoot(state);
        if (!scrollRoot) return;
        const [moved] = scrollRoot.sections.splice(fromIndex, 1);
        scrollRoot.sections.splice(toIndex, 0, moved);
      });
    },

    addGridColumn(position, size = '200px') {
      set((state) => {
        const newLeaf: LayoutNode = { id: nanoid(), type: 'leaf' };
        const newColumn: GridColumn = { id: nanoid(), size, child: newLeaf };

        if (state.root.type === 'grid') {
          const grid = state.root as unknown as GridRoot;
          if (position === 'left') {
            grid.columns.unshift(newColumn);
          } else {
            grid.columns.push(newColumn);
          }
        } else {
          const existingColumn: GridColumn = {
            id: nanoid(),
            size: '1fr',
            child: state.root,
          };
          const columns =
            position === 'left'
              ? [newColumn, existingColumn]
              : [existingColumn, newColumn];
          state.root = {
            id: nanoid(),
            type: 'grid',
            columns,
            headerSections: [],
            footerSections: [],
          } as unknown as LayoutNode;
        }
      });
    },

    removeGridColumn(columnId) {
      set((state) => {
        if (state.root.type !== 'grid') return;
        const grid = state.root as unknown as GridRoot;
        grid.columns = grid.columns.filter((c) => c.id !== columnId);
        if (grid.columns.length === 1) {
          state.root = grid.columns[0].child;
        }
      });
    },

    resizeGridColumn(columnId, size) {
      set((state) => {
        if (state.root.type !== 'grid') return;
        const grid = state.root as unknown as GridRoot;
        const col = grid.columns.find((c) => c.id === columnId);
        if (col) col.size = size;
      });
    },

    addGridSection(position) {
      set((state) => {
        if (state.root.type !== 'grid') return;
        const grid = state.root as unknown as GridRoot;
        const newSection: SectionNode = {
          id: nanoid(),
          type: 'section',
          height: { type: 'min', value: '200px' },
          child: { id: nanoid(), type: 'leaf' },
        };
        if (position === 'top') {
          if (!grid.headerSections) grid.headerSections = [];
          grid.headerSections.push(newSection);
        } else {
          if (!grid.footerSections) grid.footerSections = [];
          grid.footerSections.push(newSection);
        }
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
