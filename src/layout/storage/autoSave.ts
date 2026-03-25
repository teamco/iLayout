// src/layout/storage/autoSave.ts
import type { LayoutStorage } from './types';
import { useLayoutStore } from '../store/layoutStore';

let timer: ReturnType<typeof setTimeout> | null = null;
let currentLayoutId: string | null = null;
let currentStorage: LayoutStorage | null = null;

export function initAutoSave(layoutId: string, storage: LayoutStorage): () => void {
  // Cancel any pending save for previous layout
  if (timer) clearTimeout(timer);
  currentLayoutId = layoutId;
  currentStorage = storage;

  return useLayoutStore.subscribe(
    state => state.root,
    root => {
      if (timer) clearTimeout(timer);
      const id = currentLayoutId;
      const s = currentStorage;
      timer = setTimeout(() => {
        if (id && s) s.save(id, root);
      }, 1000);
    },
  );
}
